import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {
	Engine,
	Scene,
	ArcRotateCamera,
	Vector3,
	HemisphericLight,
	Mesh,
	ImportMeshAsync,
	AbstractMesh,
	InstancedMesh,
	Color4,
	GizmoManager,
	CreateGround,
	// Quaternion
} from "@babylonjs/core";

// ModelDatabase keeps track of what 'Models', as in mesh-arrays, we've imported/loaded.
// This allows us to create InstancedMeshes, which greatly improves performance. Less drawcalls! Textures are also shared, I'm not sure that they necessarily *need* to be shared though.
// As soon as a Model - which actually, in Babylon, seems to be more like a Scene - is loaded, we add the path and the Model to the dictionary (map).
// Next time we try to load a Model, we look in the database and check whether the path has been encountered earlier or not.
// If it's been saved, we create an instance using the base Model and return it to the app.
class ModelDatabase {
	dict: Map<string, Model> = new Map<string, Model>();
}

export class Model {
	private meshes: Mesh[] = [];

	initialize(abstractMeshes: AbstractMesh[]) {
		for (var meshIndex = 0; meshIndex < abstractMeshes.length; meshIndex++) {
			let abstractMesh = abstractMeshes[meshIndex]!;
			console.log("Initializing model. AbstractMesh:", abstractMesh);

			if (abstractMesh.geometry === null) {
				// No point in saving the mesh if there's no geometry.
				continue;
			}

			abstractMesh.setEnabled(false); // Disable.
			abstractMesh.position = Vector3.Zero();
			abstractMesh.isVisible = false; // Hide the base meshes.
			abstractMesh.isPickable = false; // Not pickable.
			abstractMesh.scaling = Vector3.One(); // Reset some data which we might set when creating an instance of the mesh.
			abstractMesh.receiveShadows = false;

			this.meshes.push(abstractMesh as Mesh);
		}
	}

	getMeshes(): Mesh[] { return this.meshes; }

	createInstance(): InstancedModel {
		return new InstancedModel(this);
	}
}

export class InstancedModel {
	private instancedMeshes: InstancedMesh[] = [];

	private position: Vector3;
	private scaling:  Vector3;

	constructor(model: Model) {
		let modelMeshes = model.getMeshes();

		for (var meshIndex = 0; meshIndex < modelMeshes.length; meshIndex++) {
			var mesh = modelMeshes[meshIndex]! as Mesh;
			
			let instance = mesh.createInstance(mesh.name + " - Instance");
	
			// Set up some values. Make the instance "come to life".
			instance.setEnabled(true);
			instance.isVisible = true;
			
			this.instancedMeshes.push(instance);
		}

		this.position = Vector3.Zero();
		this.scaling  = Vector3.One();
	}
	
	getPosition(): Vector3 { return this.position; }
	setPosition(position: Vector3) {
		this.position = position;

		this.instancedMeshes.forEach((instancedMesh) => {
			instancedMesh.position = this.position;
		})
	}

	rotate(axis: Vector3, degrees: number) { // NOTE: SS - We should have and use our own Vector3 here to not be too dependent on Babylon. 
		const radians = degrees * (Math.PI / 180);

		this.instancedMeshes.forEach((instancedMesh) => {
			instancedMesh.rotate(axis, radians);
		})
	}

	getScale(): Vector3 { return this.scaling; }
	setScale(scale: Vector3) {
		this.scaling = scale;

		this.instancedMeshes.forEach((instancedMesh) => {
			instancedMesh.scaling = this.scaling;
		})
	}
	scaleByScalar(scalar: number) {
		this.setScale(new Vector3(scalar, scalar, scalar));
	}

	showBoundingBox(show: boolean) {
		this.instancedMeshes.forEach((instancedMesh) => {
			instancedMesh.showBoundingBox = show;
		})
	}
}

export class Environment {
	private canvas: HTMLCanvasElement;

	private engine: Engine;
	private scene: Scene;

	private modelDatabase: ModelDatabase;

	private gizmoManager: GizmoManager;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;

		this.engine = new Engine(this.canvas, true, {}, true);
		this.scene  = new Scene(this.engine);
		this.scene.clearColor = Color4.FromInts(0, 88, 163, 255);
		
		this.modelDatabase = new ModelDatabase();

		this.gizmoManager = new GizmoManager(this.scene);
		this.gizmoManager.positionGizmoEnabled = true;
		this.gizmoManager.boundingBoxGizmoEnabled = true;
		this.gizmoManager.clearGizmoOnEmptyPointerEvent = true;

		{ // Listen to events.
			window.addEventListener("keydown", (ev) => {
				// if (document.activeElement === this.canvas) { // NOTE: SS - This makes sure that the correct debuglayer is opened when you have a page with multiple canvases.
					if (ev.shiftKey && ev.ctrlKey && ev.altKey && (ev.key.toLowerCase() === "i")) { // Shift + Ctrl + Alt + I
						let debugLayer = this.scene.debugLayer;
			
						if (!debugLayer.isVisible()) {
							debugLayer.show();
						}
						else {
							debugLayer.hide();
						}
					}
				// }
			});

			// Setup keybinds.
			type Keybind = () => void;
			let keybinds: Map<string, Keybind> = new Map<string, Keybind>();
			keybinds.set('w', () => {
				this.gizmoManager.positionGizmoEnabled = !this.gizmoManager.positionGizmoEnabled;
			});
			keybinds.set('r', () => {
				this.gizmoManager.rotationGizmoEnabled = !this.gizmoManager.rotationGizmoEnabled;
			});
			keybinds.set('s', () => {
				this.gizmoManager.scaleGizmoEnabled = !this.gizmoManager.scaleGizmoEnabled;
			});
			keybinds.set('b', () => {
				this.gizmoManager.boundingBoxGizmoEnabled = !this.gizmoManager.boundingBoxGizmoEnabled;
			});

			document.onkeydown = (e) => {
				let potentialKeybindCallback = keybinds.get(e.key.toLowerCase());
				if (potentialKeybindCallback !== undefined) {
					potentialKeybindCallback();
				}
			};
		}
	}

	// TODO: SS - Combine 'setup' and 'run'? Not sure. It might be a good idea to have them seperate so the user
	// can be explicit when they want to prepare/setup the scene and when they want the main-loop to start.
	setup(callback: () => Promise<void>) {
		callback().then(() => {
			this.scene.render();
		});
	}

	run(): void {
		if (this.engine.activeRenderLoops.length > 0) {
			console.log("Environment is already running!"); // NOTE: SS - I would like to assert here but I'm not sure that it's the correct thing to do in the web-world.
			return;
		}

		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
	}
	
	async createInstanceOfModel(path: string): Promise<InstancedModel | undefined> {
		console.log("Loading model, path", path);

		// Check if we've already loaded the model. If we have, then this model won't be undefined.
		var model = this.modelDatabase.dict.get(path);

		if (model === undefined) {
			// If we haven't already loaded the model, load it then add it to the database.
			console.log(`Model/scene at path '${path}' has not been loaded yet, loading ...`);

			var result = await ImportMeshAsync(path, this.scene); // NOTE: SS - Not sure why it's called 'ImportMeshAsync' as it imports a lot more than 1 mesh.. Lights, particle-systems, etc. 'ImportSceneAsync' or something feels more correct to me.
			if (result.meshes.length == 0) {
				console.log("Failed to load model, no meshes found.")
				return undefined;
			}

			var root = result.meshes[0];
			root!.name = path;

			let modelBase = new Model();
			modelBase.initialize(result.meshes);
			this.modelDatabase.dict.set(path, modelBase);

			model = this.modelDatabase.dict.get(path);
		}

		// Create an instance of the model and return it.
		return model!.createInstance();
	}

	// Below are some attempts at hiding Babylon from the main application 'app.ts'.

	createHemisphericLight(name: string, direction: Vector3): void {
		new HemisphericLight(name, direction, this.scene);
	}

	createArcRotateCamera(name: string, longitudRotation: number, latitudeRotation: number, distanceFromTarget: number, target: Vector3): void {
		new ArcRotateCamera(name, longitudRotation, latitudeRotation, distanceFromTarget, target, this.scene)
			.attachControl(this.canvas, true);
	}

	createPlane(name: string, width: number, height: number): void {
		CreateGround(name, { width, height }, this.scene);
	}
}