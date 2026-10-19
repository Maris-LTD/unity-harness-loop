# Procedural prop meshes

Use this when a recipe needs a simple round prop (bucket, pot, cup, barrel, hat) and the project has no model yet. It
costs nothing, takes one Editor call, and gives a placeholder good enough to judge the motion. It cannot make anything
organic (characters, animals, a vacuum cleaner). Those need real art or a paid generator, and that is the user's call.

## How the bucket is built

`scripts/procedural-bucket.eval.cs` is a body for `unity command eval` (the Unity CLI wraps it in a method with
`UnityEngine` and `UnityEditor` imported). Edit the variables at the top, then run:

```bash
unity command eval "$(cat references/scripts/procedural-bucket.eval.cs)" --json --no-banner
```

- **Body, lathed:** a profile polyline of `(radius, height)` points is swept around Y in 40 steps: bottom → outer
  wall flaring up → rim lip → inner wall → inner floor. Each profile segment gets its own vertex strip, so edges stay
  crisp after `RecalculateNormals`. Winding is chosen so the outer wall faces out, the inner wall faces in, the floor
  bottom faces down, and the inner floor and rim top face up.
- **Handle, a tube:** a half ellipse over the mouth (`R`, `0.95R` tall), 10 sides. Its winding is picked at runtime
  by checking the first triangle's normal against the outward direction. Do not make it double-sided with shared
  vertices: the normals cancel out and it renders black.
- Two submeshes (body, handle). Each material is a copy of an existing game material with a new `_BaseColor`, so it
  uses the game's shader (toon or lit) and fits in.
- Saves `<name>.asset` (mesh), `<name>Body.mat`, `<name>Handle.mat` and a prefab with MeshFilter + MeshRenderer,
  shadows off. The pivot is the bottom centre, Y up, and the mouth is at about 0.8 units.

To change the shape, edit the `profile` array: a taller wall or a wider flare gives a vase, a short wide wall a pot,
a constant radius a can.

## Pitfall: re-running the script

The script deletes and recreates the mesh and material assets. A prefab that already exists may keep pointing at the
deleted objects in the Editor's memory and render nothing, even though the YAML on disk has the right GUIDs.
Afterwards, check the prefab's `MeshFilter.sharedMesh` and materials. If either is null, run
`AssetDatabase.ImportAsset(folder, ForceUpdate | ImportRecursive)` and re-import the prefab.

## Wiring

Reference the prefab from config (`GatherPourSettings.container`), never from code, so art can swap it. Rent and return
it through the project's object pool if it has one. Size it with `containerScale`. The inside spot and height are in
the prefab's own units, so keep the pivot convention when replacing it.
