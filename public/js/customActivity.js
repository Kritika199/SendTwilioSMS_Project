define([
    'postmonger'
], function(Postmonger) {
    'use strict';

    var connection = new Postmonger.Session();
    var payload = {};
    var lastStepEnabled = false;
    var steps = [ // initialize to the same value as what's set in config.json for consistency
        { "label": "Create SMS Message", "key": "step1" },
        { "label": "Create SMS Body", "key": "step2" }
    ];
    var currentStep = steps[0].key;

    $(window).ready(onRender);

    connection.on('initActivity', initialize);
    connection.on('requestedTokens', onGetTokens);
    connection.on('requestedEndpoints', onGetEndpoints);

    connection.on('clickedNext', save);
    // connection.on('clickedBack', onClickedBack); // Uncomment if you need back button handling
    // connection.on('gotoStep', onGotoStep); // Uncomment if you need to handle step navigation

    function onRender() {
        // JB will respond the first time 'ready' is called with 'initActivity'
        connection.trigger('ready');
        connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');
    }

    function initialize(data) {
        console.log("Initializing data data: " + JSON.stringify(data));
        if (data) {
            payload = data;
        }

        var hasInArguments = Boolean(
            payload['arguments'] &&
            payload['arguments'].execute &&
            payload['arguments'].execute.inArguments &&
            payload['arguments'].execute.inArguments.length > 0
        );

        var inArguments = hasInArguments ? payload['arguments'].execute.inArguments : {};

        console.log('Has In arguments: ' + JSON.stringify(inArguments));

        $.each(inArguments, function(index, inArgument) {
            $.each(inArgument, function(key, val) {
                if (key === 'accountSid') {
                    $('#accountSID').val(val);
                }

                if (key === 'authToken') {
                    $('#authToken').val(val);
                }

                if (key === 'messagingService') {
                    $('#messagingService').val(val);
                }

                if (key === 'body') {
                    $('#messageBody').val(val);
                }
            });
        });

        connection.trigger('updateButton', {
            button: 'next',
            text: 'done',
            visible: true
        });

        // Handle dropdown field population for the schema
        connection.trigger('requestSchema');
        connection.on('requestedSchema', function(data) {
            const schema = data['schema'];

            for (var i = 0, l = schema.length; i < l; i++) {
                let attr = schema[i].key;

                // Populate select dropdown with schema attributes
                let option = $('<option></option>')
                    .attr('id', schema[i].key)
                    .text(schema[i].name);

                $('#idField').append(option);
            }
        });
    }

    function onGetTokens(tokens) {
        console.log("Tokens function: " + JSON.stringify(tokens));
    }

    function onGetEndpoints(endpoints) {
        console.log("Get End Points function: " + JSON.stringify(endpoints));
    }

    function save() {
        var accountSid = $('#accountSID').val();
        var authToken = $('#authToken').val();
        var messagingService = $('#messagingService').val();
        var body = $('#messageBody').val();

        // Get the selected field from dropdown for dynamic field mapping
        var idField = $('#idField').find('option:selected').html();

        payload['arguments'].execute.inArguments = [{
            "accountSid": accountSid,
            "authToken": authToken,
            "messagingService": messagingService,
            "body": body,
            "to": "{{Contact.Attribute.Twilio_SMS_DE.TwilioNumber}}", // Data extension column
            "idField": idField // Pass selected field to inArguments
        }];

        payload['metaData'].isConfigured = true;

        console.log("Payload on SAVE function: " + JSON.stringify(payload));
        connection.trigger('updateActivity', payload);
    }

    function onClickedNext() {
        // Handle the logic when 'Next' is clicked
        var idField = $('#idField').find('option:selected').html();
        payload['arguments'].execute.inArguments.push({
            idField: idField
        });
        payload['metaData'].isConfigured = true;
        connection.trigger('updateActivity', payload);
    }
});
