import { Environment } from "./environment";
import { Vector3, } from "@babylonjs/core"; // TODO: SS - We should not need Babylon here. By not using Babylon here, we'll not be as dependent on Babylon if we ever want to change what renderer/"engine"/framework we use.

class App {
	constructor() {
		// Get the canvas that will "host"/contain the environment.
		let canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;

		// Create and set up the environment that will be hosted in the canvas above.
		var environment = new Environment(canvas);

		environment.setup(async () => { // Let's describe what this environment should contain and look like.
			environment.createArcRotateCamera(
				"Camera",
				Math.PI - 0.7,
				Math.PI / 3 + 0.25,
				220,
				new Vector3(0, 10, 0)
			);
			environment.createHemisphericLight("Light", new Vector3(1, 1, 0));
			environment.createPlane("Ground", 160, 160);

			var bekvam1 = await environment.createInstanceOfModel("./models/bekvam.glb");
			bekvam1?.scaleByScalar(1.0);
			bekvam1?.setPosition(new Vector3(53, 35, 0));
			bekvam1?.rotate(new Vector3(0, 0, 1), 90 + (Math.random() - 0.5) * 2 * 10);

			var sofa1 = await environment.createInstanceOfModel("./models/sofa.glb");
			sofa1?.scaleByScalar(0.42);
			sofa1?.setPosition(new Vector3(0, 1, 0));
			sofa1?.rotate(new Vector3(0, 0, 1), -1);

			var sofa2 = await environment.createInstanceOfModel("./models/sofa.glb");
			sofa2?.scaleByScalar(0.42);
			sofa2?.setPosition(new Vector3(-1.1, -0.15, 0));
			sofa2?.rotate(new Vector3(0, 0, 1), 92);

			var lamp1 = await environment.createInstanceOfModel("./models/lamp.glb");
			lamp1?.scaleByScalar(0.4);
			lamp1?.setPosition(new Vector3(-20, -40, 0));

			var table = await environment.createInstanceOfModel("./models/coffee_table.glb");
			table?.scaleByScalar(4);
			table?.setPosition(new Vector3(2, 6, 0));
			table?.rotate(new Vector3(0, 1, 0), 90);
		});

		// Run the environment (starts the render-loop/main-loop).
		environment.run();
	}
}
new App();