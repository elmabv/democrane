Web.on('loaded', async event => {

  $(document.body).append(
    $('button').text('START 1').on('click', e => {
      console.log('START');
      setValue('elmabv/democrane/plc/axisx/pos', 45);
      setValue('elmabv/democrane/plc/axisy/pos', 450);
      setValue('elmabv/democrane/plc/axisz/pos', 4577);
      setValue('elmabv/democrane/plc/state', 3);
    }),
    $('button').text('START 2').on('click', e => {
      console.log('START');
      setValue('elmabv/democrane/plc/axisx/pos', 453);
      setValue('elmabv/democrane/plc/axisy/pos', 4503);
      setValue('elmabv/democrane/plc/axisz/pos', 457);
      setValue('elmabv/democrane/plc/state', 3);
    }),
  )


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
});
