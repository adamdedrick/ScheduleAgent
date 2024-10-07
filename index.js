const cron = require('node-cron');
const mongoose = require('mongoose');
const statusModel = require('./statusModel');
const axios = require('axios');
const Temperature = require('./temperatureModel');


// Update the keepalive status
async function updateStatus() {
  try {
    // Connect to MongoDB (replace with your connection string)
    await mongoose.connect('mongodb://localhost:27017/mydb', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })

    // Find a status record (you could filter based on specific criteria)
    let status = await statusModel.findOne(); // Get the first status record

    if (!status) {
      // If no status record exists, create a new one
      status = new statusModel({
        lastSeenDateTime: new Date(),  // Current date and time
        lastGoodRun: null,
        lastFailedRun: null,
        inErrorMode: false
      });
    } else {
      // If a status record exists, update the fields
      status.lastSeenDateTime = new Date(); // Update to the current time
    }

    // Save the updated or new status record to the database
    const savedStatus = await status.save();
    console.log('Status updated:', savedStatus);

  } catch (error) {
    console.error('Error updating status:', error);
  } finally {
    mongoose.connection.close(); // Optionally close the connection after updating
  }
}

// Update the error state
async function updateErrorState(dateTimeRun, success) {
  try {
    // Connect to MongoDB (replace with your connection string)
    await mongoose.connect('mongodb://localhost:27017/mydb', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    // Find a status record (you could filter based on specific criteria)
    let status = await statusModel.findOne(); // Get the first status record

    if (!status) {
      // If no status record exists, create a new one
      status = new statusModel({
        lastSeenDateTime: new Date(),  // Current date and time
        lastGoodRun: null,
        lastFailedRun: null,
        inErrorMode: false
      });
    } else {
      // If a status record exists, update the fields
      status.lastSeenDateTime = new Date(); // Update to the current time
    }
    if (success) {
      lastGoodRun = dateTimeRun;
      inErrorMode = false;
    } else {
      lastFailedRun = dateTimeRun;
      inErrorMode = true;
    }


    // Save the updated or new status record to the database
    const savedStatus = await status.save();
    console.log('Status updated:', savedStatus);

  } catch (error) {
    console.error('Error updating status:', error);
  } finally {
    mongoose.connection.close(); // Optionally close the connection after updating
  }
}




// Function to update the temperature record for a specific date
async function updateTemperatureRecord(date, newTemperature) {
  try {
    date.setHours(0,0,0,0);
    // Connect to MongoDB (replace with your connection string)
    await mongoose.connect('mongodb://localhost:27017/mydb', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    // Find the document for the given date
    let temperatureRecord = await Temperature.findOne({ date });



    if (!temperatureRecord) {
      // If no document is found for the given date, create a new record
      temperatureRecord = new Temperature({
        date: date,
        temperatures: [newTemperature],
        averageTemp: newTemperature
      });
    } else {
      // If document is found, update the temperatures array
      temperatureRecord.temperatures.push(newTemperature);

      // Recalculate the averageTemp
      const sum = temperatureRecord.temperatures.reduce((acc, temp) => acc + temp, 0);
      temperatureRecord.averageTemp = sum / temperatureRecord.temperatures.length;
    }

    // Save the updated or new temperature record to the database
    const updatedTemperatureRecord = await temperatureRecord.save();
    console.log('Temperature record updated:', updatedTemperatureRecord);
  } catch (error) {
    console.error('Error updating temperature record:', error);
  } finally {
    // Optionally close the connection after updating
    mongoose.connection.close();
  }
}


// Function to fetch the current temperature from wttr.in and return it as a double
async function getCurrentTemperature(city) {
    const url = `https://wttr.in/${city}?format=%t`; // %t gives the temperature with °C

    try {
        const response = await axios.get(url);
        const temperatureString = response.data.trim(); // Clean up the response
        // Remove the "+" and "°C" and convert to a double
        const temperature = parseFloat(temperatureString.replace(/[+°C]/g, ''));
        
        console.log(`The current temperature in ${city} is ${temperature}°C (as a double: ${temperature})`);
        return temperature;
    } catch (error) {
        console.error(`Error fetching temperature for ${city}: `, error.message);
        return null;
    }
}



var inScheduledMaintenance = false;
async function scheduledMaintenance() {
  if (!inScheduledMaintenance) {
    inScheduledMaintenance = true;
    await updateStatus();
    inScheduledMaintenance = false;
  }

}


var inTempProcessing = false;
async function tempProcessing() {
  if (!inTempProcessing) {
    inTempProcessing = true;
    // do temp retrieval and update
    const inputDate = new Date(); // Now
    try {
      const inputTemperature = await getCurrentTemperature('London');
      await updateTemperatureRecord(inputDate, inputTemperature);
      await updateErrorState(inputDate, true);
    } catch (error) {
      // Failed to retrieve temp, so update failure 
      await updateErrorState(inputDate, false);
    }

    console.log('temp processing');
    inTempProcessing = false;
  }

}



// Schedule a recurring task every 15 minutes for updates & keep alives
const maintenanceCronString = '*/15 * * * *';
cron.schedule(maintenanceCronString, () => {
  scheduledMaintenance();
});

// Schedule a recurring task at 10AM, 2PM and 5PM
const tempProcesscronString = '0 10,14,17 * * *';
cron.schedule(tempProcesscronString, () => {
  tempProcessing();
});

tempProcessing();

