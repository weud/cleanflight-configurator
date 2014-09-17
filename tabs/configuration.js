'use strict';

TABS.configuration = {};

TABS.configuration.initialize = function (callback) {
    var self = this;
    GUI.active_tab_ref = this;
    GUI.active_tab = 'configuration';
    googleAnalytics.sendAppView('Configuration');


    function check_compatibility() {
        if (bit_check(CONFIG.capability, 30)) {
            // new stuff supported, continue fetching configuration data
            load_config();
        } else {
            // old version, deny access
            $('#content').text('We are sorry, but advanced configuration is only available for boards with latest firmware, please update');

            if (callback) callback();
        }
    }

    function load_config() {
        MSP.send_message(MSP_codes.MSP_CONFIG, false, false, load_rc_map);
    }

    function load_rc_map() {
        MSP.send_message(MSP_codes.MSP_RCMAP, false, false, load_misc);
    }

    function load_misc() {
        MSP.send_message(MSP_codes.MSP_MISC, false, false, load_acc_trim);
    }

    function load_acc_trim() {
        MSP.send_message(MSP_codes.MSP_ACC_TRIM, false, false, load_html);
    }

    function load_html() {
        $('#content').load("./tabs/configuration.html", process_html);
    }

    MSP.send_message(MSP_codes.MSP_IDENT, false, false, check_compatibility);

    function process_html() {
        // translate to user-selected language
        localize();

        // index references
        var RCMAPlLetters = ['A', 'E', 'R', 'T', '1', '2', '3', '4'];

        // generate mixer
        var mixerList = [
            {name: 'Tricopter', image: 'tri'},
            {name: 'Quad +', image: 'quadp'},
            {name: 'Quad X', image: 'quadx'},
            {name: 'Bicopter', image: 'custom'},
            {name: 'Gimbal', image: 'custom'},
            {name: 'Y 6', image: 'y6'},
            {name: 'HEX 6', image: 'hex6p'},
            {name: 'Flying Wing', image: 'custom'},
            {name: 'Y 4', image: 'y4'},
            {name: 'HEX 6 X', image: 'hex6x'},
            {name: 'OCTO X8', image: 'octox'},
            {name: 'OCTO Flat +', image: 'octox'},
            {name: 'OCTO Flat X', image: 'octox'},
            {name: 'Airplane', image: 'airplane'},
            {name: 'Heli 120', image: 'custom'},
            {name: 'Heli 90', image: 'custom'},
            {name: 'Vtail 4', image: 'vtail'},
            {name: 'Hex 6 H', image: 'custom'},
            {name: 'PPM to SERVO', image: 'custom'},
            {name: 'Dualcopter', image: 'custom'},
            {name: 'Singlecopter', image: 'custom'},
            {name: 'Custom', image: 'custom'}
        ];

        var mixer_list_e = $('select.mixerList');
        for (var i = 0; i < mixerList.length; i++) {
            mixer_list_e.append('<option value="' + (i + 1) + '">' + mixerList[i].name + '</option>');
        }

        mixer_list_e.change(function () {
            var val = parseInt($(this).val());

            BF_CONFIG.mixerConfiguration = val;

            $('.mixerPreview img').attr('src', './images/motor_order/' + mixerList[val - 1].image + '.svg');
        });

        // select current configuration
        mixer_list_e.val(BF_CONFIG.mixerConfiguration).change();

        // generate features
        var featureNames = [
            'PPM - Disable PWM input and enable PPM input',
            'VBAT',
            'INFLIGHT_ACC_CAL',
            'SERIALRX',
            'MOTOR_STOP',
            'SERVO_TILT',
            'SOFTSERIAL',
            'LED_RING',
            'GPS',
            'FAILSAFE',
            'SONAR',
            'TELEMETRY',
            'POWERMETER',
            'VARIO',
            '3D'
        ];

        var features_e = $('.features');
        for (var i = 0; i < featureNames.length; i++) {
            var element = $('<dt><input id="feature-' + i + '" type="checkbox" /></dt><dd><label for="feature-' + i + '">' + featureNames[i] + '</label></dd>');
            element.find('input').attr('checked', bit_check(BF_CONFIG.features, i));

            features_e.append(element);
        }

        // fill board alignment
        $('input[name="board_align_roll"]').val(BF_CONFIG.board_align_roll);
        $('input[name="board_align_pitch"]').val(BF_CONFIG.board_align_pitch);
        $('input[name="board_align_yaw"]').val(BF_CONFIG.board_align_yaw);

        // fill accel trims
        $('input[name="roll"]').val(CONFIG.accelerometerTrims[1]);
        $('input[name="pitch"]').val(CONFIG.accelerometerTrims[0]);

        // fill magnetometer
        $('input[name="mag_declination"]').val(MISC.mag_declination / 10);

        // fill throttle
        $('input[name="minthrottle"]').val(MISC.minthrottle);
        $('input[name="maxthrottle"]').val(MISC.maxthrottle);
        $('input[name="failsafe_throttle"]').val(MISC.failsafe_throttle);
        $('input[name="mincommand"]').val(MISC.mincommand);

        // fill battery
        $('input[name="mincellvoltage"]').val(MISC.vbatmincellvoltage);
        $('input[name="maxcellvoltage"]').val(MISC.vbatmaxcellvoltage);
        $('input[name="voltagescale"]').val(MISC.vbatscale);


        // UI hooks
        $('input', features_e).change(function () {
            var element = $(this),
                index = $('input', features_e).index(element),
                state = element.is(':checked');

            if (state) {
                BF_CONFIG.features = bit_set(BF_CONFIG.features, index);
            } else {
                BF_CONFIG.features = bit_clear(BF_CONFIG.features, index);
            }
        });

        $('a.save').click(function () {
            // gather data that doesn't have automatic change event bound
            BF_CONFIG.board_align_roll = parseInt($('input[name="board_align_roll"]').val());
            BF_CONFIG.board_align_pitch = parseInt($('input[name="board_align_pitch"]').val());
            BF_CONFIG.board_align_yaw = parseInt($('input[name="board_align_yaw"]').val());

            CONFIG.accelerometerTrims[1] = parseInt($('input[name="roll"]').val());
            CONFIG.accelerometerTrims[0] = parseInt($('input[name="pitch"]').val());
            MISC.mag_declination = parseFloat($('input[name="mag_declination"]').val()) * 10;

            MISC.minthrottle = parseInt($('input[name="minthrottle"]').val());
            MISC.maxthrottle = parseInt($('input[name="maxthrottle"]').val());
            MISC.failsafe_throttle = parseInt($('input[name="failsafe_throttle"]').val());
            MISC.mincommand = parseInt($('input[name="mincommand"]').val());

            MISC.vbatmincellvoltage = parseFloat($('input[name="mincellvoltage"]').val()) * 10;
            MISC.vbatmaxcellvoltage = parseFloat($('input[name="maxcellvoltage"]').val()) * 10;
            MISC.vbatscale = parseInt($('input[name="voltagescale"]').val());

            function save_misc() {
                MSP.send_message(MSP_codes.MSP_SET_MISC, MSP.crunch(MSP_codes.MSP_SET_MISC), false, save_acc_trim);
            }

            function save_acc_trim() {
                MSP.send_message(MSP_codes.MSP_SET_ACC_TRIM, MSP.crunch(MSP_codes.MSP_SET_ACC_TRIM), false, save_to_eeprom);
            }

            function save_to_eeprom() {
                MSP.send_message(MSP_codes.MSP_EEPROM_WRITE, false, false, reboot);
            }

            function reboot() {
                GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));

                GUI.tab_switch_cleanup(function() {
                    MSP.send_message(MSP_codes.MSP_SET_REBOOT, false, false, reinitialize);
                });
            }

            function reinitialize() {
                GUI.log(chrome.i18n.getMessage('deviceRebooting'));

                MSP.send_message(MSP_codes.MSP_IDENT, false, false, function () {
                    GUI.log(chrome.i18n.getMessage('deviceReady'));
                    TABS.configuration.initialize();
                });
            }

            MSP.send_message(MSP_codes.MSP_SET_CONFIG, MSP.crunch(MSP_codes.MSP_SET_CONFIG), false, save_misc);
        });

        // status data pulled via separate timer with static speed
        GUI.interval_add('status_pull', function status_pull () {
            MSP.send_message(MSP_codes.MSP_STATUS);
        }, 250, true);

        if (callback) callback();
    }
};

TABS.configuration.cleanup = function (callback) {
    if (callback) callback();
};