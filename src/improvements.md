# Improvements:
* Isolate babylon from the rest of the applications.
    One day, something new might come out or we'd decide to change the underlying structure.
    If Babylon is all over the place, it will take more time and be annoying to replace it.
    Changing out the underlying framework depending on what platform we're on should be easier too, there's less code that we'd have to touch.

* Fix pivots, if possible.
    I noticed that the models I downloaded were not only in different scales, some were not centered on origo.
    Maybe there's a way around that but I chose to spend my time on other features instead.
    I guess one solution would be to open them up in Blender for example, moving them and re-exporting them.

* Shadows and better lighting.
    I tried to use a different light since the hemispheric light can't cast shadows but I could not get it to work yet. Probably not much work needed to make it work.
    Would be neat to have a pointlight in the lamp! :)

* Gizmo with InstancedMesh
    For some reason, selecting an InstancedMesh and manipulating it using the gizmos (move, rotate, scale) affects all the other instanced meshes with the same base-mesh.
    My guess is that it's selecting the parent of all the instances. We probably need to interject or communicate to the GizmoManager the fact that
    they should not be moved together. Instances can be moved manually using the SceneExplorer/debug-layer and it works well there.

* SceneExplorer/Inspector/DebugLayer
    My work allows for creating many canvases with their own environments, which is pretty cool. One problem I encountered was that the built-in "scene debug layer" does not place itself "inside of"/over the canvas. Because of this, using the debug layer when you have more than one canvas feels janky. I'm sure there's a way to solve this.