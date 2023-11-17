Web.on('loaded', async event => {
  var mqttClient = new Paho.MQTT.Client('aliconnect.nl', 1884, "myclientid_" + parseInt(Math.random() * 100, 10));
  function setValue(topic,value){
    message = new Paho.MQTT.Message(String(value));
    message.destinationName = topic;
    mqttClient.send(message);
  }
  mqttClient.onConnectionLost = function (responseObject) {
    console.error("connection lost: " + responseObject.errorMessage);
  };
  let sourcepos,destpos,state;
  mqttClient.onMessageArrived = function (message) {
    console.debug(message.destinationName, '=', message.payloadString);
    // document.body.querySelectorAll(`input[name="${message.destinationName}"]`).forEach(el => el.value = message.payloadString);
    switch (message.destinationName) {
      case 'elmabv/democrane/plc/sourcepos': {
        return sourcepos = JSON.parse(message.payloadString);
      }
      case 'elmabv/democrane/plc/destpos': {
        return destpos = JSON.parse(message.payloadString);
      }
      case 'elmabv/democrane/plc/state': {
        switch(message.payloadString) {
          case 'run': {
            console.log('start pick and place');
            setTimeout(() => {
              console.log('end pick and place');
              setValue('elmabv/democrane/plc/state', 'done');
            },3000)
            return;
          }
        }
      }
    }
  };
  var options = {
    useSSL: true,
    timeout: 3,
    onSuccess() {
      console.log("mqtt connected");
      // Connection succeeded; subscribe to our topic, you can add multile lines of these
      mqttClient.subscribe('elmabv/democrane/#', { qos: 1 });
    },
    onFailure(message) {
      console.log("Connection failed: " + message.errorMessage);
    }
  };
  mqttClient.connect(options);
});
