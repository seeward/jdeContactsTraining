/*title - JDE Contacts App
author - christian.mccabe@steltix.com
date - aug.11.2015
details - JS training using JDE E1 AIS  
*/

// JS document level method that takes one param
// the function to fire when the document or device is ready

$(document).ready(function() { // document or device has been fully loaded - change to device ready for build

    // var to cache user info returned from AIS
    var userInfo = {};

    // init empty var to hold AIS token
    var token = "";

    // var to hold searchterm

    var searchText = "";


    // cache AIS endpoints
    var configUrl = "http://demo.steltix.com/jderest/defaultconfig";
    var tokenUrl = "http://demo.steltix.com/jderest/tokenrequest";
    var formUrl = "http://demo.steltix.com/jderest/formservice";


    // var to hold the JSON for requesting a token from AIS
    var tokenRequestJSON = {
        "username": "demo",
        "password": "demo",
        "deviceName": "RESTclient"
    }


    // format the token request as a string
    tokenRequestJSON = JSON.stringify(tokenRequestJSON);

    // function to filter address list
    var filterSet = function() {

        // refers to the search input id searchTerm
        $('#searchTerm').keyup(function() {

            // fires a function on each key up event
            $('#searchTerm').on("keyup", function() {

                searchText = $('#searchTerm').val();

                console.log(searchText);
            })
        });
    };

    // initialize filter function
    filterSet();


    $("#getResults").on("click", function(e) {

        e.preventDefault();
        getForm();

    });

    // function to request a token from AIS
    var getToken = function() {

        // jQuery method to make http reuests
        // accepts 1 param - config obj
        $.ajax({
            url: tokenUrl, // url to make request against
            dataType: "json", // format of server response
            data: tokenRequestJSON, // form data to send with request
            type: "POST", // http method to use

        }).done(function(data) { // data will olhd the JSON of the server response

            console.log("Server said: " + JSON.stringify(data));
            // cache user data from AIS into global JS obj userInfo
            userInfo = data.userInfo;

            // cachec token into user obj as well
            token = userInfo.token;

            // store the userInfo in localStorage 
            window.localStorage.setItem("userInfo", JSON.stringify(userInfo));

            // call the getForm function
            // getForm();
        });
    };


    // function to interact with E1 through AIS
    var getForm = function() {

        // setup the JSON request obj
        var formRequestJSON = {
            "deviceName": "RESTclient", // this can be anyset of vchars under 10 chars
            "returnControlIDs": "", // which E1 form controls to return from AIS
            "version": "ZJDE0001", // E1 version to run against the program

            // JS array of actions to be performed on the form
            "formActions": [{
                    "value": "C",
                    "command": "SetQBEValue",
                    "controlID": "1[50]"
                }, 

                {
                    "command": "SetControlValue",
                    "value": searchText,
                    "controlID": "58"
                },

                {
                    "value": "on",
                    "command": "SetCheckboxValue",
                    "controlID": "62"
                }, {
                    "value": "on",
                    "command": "SetCheckboxValue",
                    "controlID": "63"
                }, {
                    "command": "DoAction",
                    "controlID": "15"
                }
            ],

            "formName": "P01012_W01012B" // E1 program and form to make request against

        };

        // add token property to the JSON obj from global var token
        formRequestJSON.token = token;
        // foirmat request into JSON string
        formRequestJSON = JSON.stringify(formRequestJSON);

        // make request to AIS
        $.ajax({
            url: formUrl,
            dataType: "json",
            data: formRequestJSON,
            type: "POST"
        }).done(function(data) {

            // view obj returned in the JS console
            console.log(JSON.stringify(data.fs_P01012_W01012B.data.gridData.rowset));

            // array to cache the returned customer records
            var holderArray = data.fs_P01012_W01012B.data.gridData.rowset;


            // build html string to insert into page on device
            var html = "<table id='dataTable' class='table table-striped table-condensed'>";

            // jQuery method to loop through an array
            // in this case the returned records of customers

            $.each(holderArray, function(i, o) {
                // build up temp obj to store as the ID of that ADD button
                var obj = {};
                obj.namer = o.sAlphaName_20.value;
                obj.address = o.sAddressLine1_40.value;
                obj.phone = o.sPhoneNumber_46.value;
                // build html string to insert into the page
                html += "<tr><td><button style='margin-top:5px' class='addRow btn btn-default' id='" + JSON.stringify(obj) + "'>Add</button></td><td><h4>" + o.sAlphaName_20.value + "</h4><p>" + o.sAddressLine1_40.value + "</p><p>" + o.sPhoneNumber_46.value + "</p></td></tr>";
            });

            // close off html table in the string
            html += "</table>";

            // jQeury method to insert html string into the page
            $("#dataHolder").html(html);



            // function that fires on the touchstart event of ADD button
            $(".addRow").on('touchstart click', function(e) {

                // override default actions - 
                e.stopPropagation();
                e.preventDefault();

                // cache the current record as an obj from the html ID of the button
                var deets = JSON.parse(this.id);

                // create a new contact object
                var contact = navigator.contacts.create();
                contact.displayName = deets.namer;
                contact.nickname = deets.namer;
                var phoneNumbers = [];

                // check for null values in the mobile contact field
                // more null checks are needed here
                if (deets.phone != "" || deets.phones != undefined) {
                    phoneNumbers[0] = new ContactField('mobile', deets.phone, true);
                    contact.phoneNumbers = phoneNumbers;
                }




                var name = new ContactName();
                name.familyName = deets.namer;
                contact.name = name;

                // show dialog to user to confirm
                var agree = confirm("Saving " + deets.namer + " to contacts");

                // if they choose confirm
                if (agree == true) {
                    contact.save(onSuccess, onError);
                }





            });
        });


        // handle success of contacts save
        function onSuccess(contact) {
            alert("Save Success");
        };

        // hnalde errors
        function onError(contactError) {
            alert("Error = " + contactError.code);
        };

    };



    // get token when device/document is ready 

    getToken();

});