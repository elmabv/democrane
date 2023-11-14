(function () {
  var settings = {
    port: 1883,
    http: {
      port: 1338,
    },
  };
  var mqttServer = new require("mosca").Server(settings);
  mqttServer.on("ready", function (e) {
    console.log('MQTT server is up and running')
  });
  mqttServer.on('published', function (packet, client) {
    console.log('Published', packet);
    // console.log('Client', client.id);
  });
  // fired when a client connects
  mqttServer.on('clientConnected', function (client) {
    console.log('Client Connected:', client.id);
  });
  // fired when a client disconnects
  mqttServer.on('clientDisconnected', function (client) {
    console.log('Client Disconnected:', client.id);
  });
})()
