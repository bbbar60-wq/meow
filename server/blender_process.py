import bpy
import sys
import os


def convert():
    try:
        # Get command line arguments after "--"
        argv = sys.argv
        if "--" in argv:
            argv = argv[argv.index("--") + 1:]
        else:
            print("PYTHON ERROR: No arguments provided after '--'")
            sys.exit(1)

        input_file = argv[0]
        output_file = argv[1]

        print(f"PYTHON: Opening {input_file}...")

        # Reset Blender to clean state
        bpy.ops.wm.read_factory_settings(use_empty=True)

        # Open the .blend file
        bpy.ops.wm.open_mainfile(filepath=input_file)

        # Ensure we are in Object Mode
        if bpy.ops.object.mode_set.poll():
            bpy.ops.object.mode_set(mode='OBJECT')

        # Select all mesh objects to ensure we export the actual model
        bpy.ops.object.select_all(action='DESELECT')
        for obj in bpy.data.objects:
            if obj.type == 'MESH':
                obj.select_set(True)

        # Create output directory
        output_dir = os.path.dirname(output_file)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        print(f"PYTHON: Exporting to {output_file}...")

        # Export GLB
        # UPDATED FOR BLENDER 4.x: Removed 'export_colors' as it is now default/deprecated
        bpy.ops.export_scene.gltf(
            filepath=output_file,
            export_format='GLB',
            use_selection=True,  # Only export what we selected (the meshes)
            export_apply=True,  # Apply modifiers
            export_cameras=False,  # Don't export cameras
            export_lights=False  # Don't export lights
        )

        print("PYTHON: Conversion Complete.")

    except Exception as e:
        # Print error to stdout so Node.js catches it
        print(f"PYTHON ERROR: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    convert()