const MiioValetudoRobot = require("../MiioValetudoRobot");
const RoborockGen4ValetudoRobot = require("./RoborockGen4ValetudoRobot");
const RoborockValetudoRobot = require("./RoborockValetudoRobot");

class RoborockS4MaxValetudoRobot extends RoborockGen4ValetudoRobot {
    getModelName() {
        return "S4 Max";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(RoborockValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "roborock.vacuum.a19");
    }
}



module.exports = RoborockS4MaxValetudoRobot;
