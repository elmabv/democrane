Web.on('loaded', async event => {
  const {config} = Aim;
  await Aim.fetch('https://aliconnect.nl/elmabv/democrane/api/config').get().then(config);
  await Aim.fetch('https://aliconnect.nl/elmabv/democrane/api/data').get().then(config);
  console.log(config.democrane);

  const mqttClient1 = new Paho.MQTT.Client('aliconnect.nl', 1884, "myclientid_" + parseInt(Math.random() * 100, 10));
  function setValue(topic,value){
    message = new Paho.MQTT.Message(String(value));
    message.destinationName = topic;
    mqttClient1.send(message);
  }
  mqttClient1.onConnectionLost = function (responseObject) {
    console.error("connection lost: " + responseObject.errorMessage);
  };
  mqttClient1.onMessageArrived = function (message) {
    // message = new Paho.MQTT.Message(String(message.payloadString));
    // message.destinationName = message.destinationName;
    console.debug('Cloud', message.destinationName, '=', message.payloadString);
    mqttClient2.send(message);
  };
  mqttClient1.connect({
    useSSL: true,
    timeout: 3,
    onSuccess() {
      console.log("mqtt CLOUD connected");
      mqttClient1.subscribe('elmabv/democrane/server/#', { qos: 1 });
    },
    onFailure(message) {
      console.log("Connection failed: " + message.errorMessage);
    }
  });
  const mqttClient2 = new Paho.MQTT.Client('localhost', 1338, "myclientid_" + parseInt(Math.random() * 100, 10));

  function setValue(topic,value){
    message = new Paho.MQTT.Message(String(value));
    message.destinationName = topic;
    mqttClient2.send(message);
  }

  mqttClient2.onConnectionLost = function (responseObject) {
    console.error("connection lost: " + responseObject.errorMessage);
  };
  mqttClient2.onMessageArrived = function (message) {
    console.debug('Cloud', message.destinationName, '=', message.payloadString);
    mqttClient1.send(message);
  };
  mqttClient2.connect({
    useSSL: false,
    timeout: 3,
    onSuccess() {
      console.log("mqtt LOCAL connected");
      mqttClient2.subscribe('elmabv/democrane/plc/#', { qos: 1 });
    },
    onFailure(message) {
      console.log("Connection failed: " + message.errorMessage);
    }
  });
  // await Aim.fetch('https://aliconnect.nl/elmabv/democrane/api/data.php').body({democrane:{
  //   containers:[
  //     {
  //       pos: 1,
  //     },
  //     {
  //       pos: 5,
  //     },
  //   ]
  // }}).post().then(console.log);


});
