const express = require("express");
const { Hub, sseHub } = require("expresse");


const ValetudoRobot = require("../core/ValetudoRobot");

const CapabilitiesRouter = require("./CapabilitiesRouter");
const {stringifyAndGZip} = require("../utils/streamHelpers");

class RobotRouter {
    /**
     *
     * @param {object} options
     * @param {import("../core/ValetudoRobot")} options.robot
     * @param {boolean} options.enableDebugCapability
     * @param {*} options.validator
     */
    constructor(options) {
        this.robot = options.robot;
        this.enableDebugCapability = options.enableDebugCapability;
        this.router = express.Router({mergeParams: true});

        this.validator = options.validator;

        this.initRoutes();
        this.initSSE();
    }


    initRoutes() {
        this.router.get("/", (req, res) => {
            res.json({
                manufacturer: this.robot.getManufacturer(),
                modelName: this.robot.getModelName(),
                implementation: this.robot.constructor.name
            });
        });

        this.router.get("/state", async (req, res) => {
            try {
                const polledState = await this.robot.pollState();

                stringifyAndGZip(polledState).then(data => {
                    res.header("Content-Type", "application/json; charset=utf-8");
                    res.header("Content-Encoding", "gzip");

                    res.send(data);
                }).catch(err => {
                    throw err;
                });
            } catch (err) {
                res.status(500).send(err.toString());
            }
        });

        this.router.get("/state/attributes", async (req, res) => {
            try {
                const polledState = await this.robot.pollState();

                res.json(polledState.attributes);
            } catch (err) {
                res.status(500).send(err.toString());
            }
        });

        this.router.get("/state/map", async (req, res) => {
            try {
                const polledState = await this.robot.pollState();

                stringifyAndGZip(polledState.map).then(data => {
                    res.header("Content-Type", "application/json; charset=utf-8");
                    res.header("Content-Encoding", "gzip");

                    res.send(data);
                }).catch(err => {
                    throw err;
                });
            } catch (err) {
                res.status(500).send(err.toString());
            }
        });



        this.router.use("/capabilities/", new CapabilitiesRouter({
            robot: this.robot,
            enableDebugCapability: this.enableDebugCapability,
            validator: this.validator
        }).getRouter());
    }

    initSSE() {
        this.sseHubs = {
            state: new Hub(),
            attributes: new Hub(),
            map: new Hub()
        };

        this.robot.onStateUpdated(() => {
            this.sseHubs.state.event(ValetudoRobot.EVENTS.StateUpdated, this.robot.state);
        });

        this.robot.onStateAttributesUpdated(() => {
            this.sseHubs.attributes.event(ValetudoRobot.EVENTS.StateAttributesUpdated, this.robot.state.attributes);
        });

        this.robot.onMapUpdated(() => {
            this.sseHubs.map.event(ValetudoRobot.EVENTS.MapUpdated, this.robot.state.map);
        });

        this.router.get(
            "/state/sse",
            sseHub({hub: this.sseHubs.state, flushAfterWrite: true}),
            (req, res) => {
                this.sseHubs.state.event(ValetudoRobot.EVENTS.StateUpdated, this.robot.state);
            }
        );

        this.router.get(
            "/state/attributes/sse",
            sseHub({hub: this.sseHubs.attributes, flushAfterWrite: true}),
            (req, res) => {
                this.sseHubs.attributes.event(ValetudoRobot.EVENTS.StateAttributesUpdated, this.robot.state.attributes);
            }
        );

        this.router.get(
            "/state/map/sse",
            sseHub({hub: this.sseHubs.map, flushAfterWrite: true}),
            (req, res) => {
                this.sseHubs.map.event(ValetudoRobot.EVENTS.MapUpdated, this.robot.state.map);
            }
        );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = RobotRouter;
