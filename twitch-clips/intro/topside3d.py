"""Blender (4.0) headless: 3D TOPSIDE reveal. Run: blender -b --factory-startup --python topside3d.py -- OUTDIR [frames] [samples]"""
import bpy, math, random, sys

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '/tmp/t3d'
NF = int(argv[1]) if len(argv) > 1 else 105
SAMPLES = int(argv[2]) if len(argv) > 2 else 32
RES = float(argv[3]) if len(argv) > 3 else 1.0
random.seed(4)

sc = bpy.context.scene
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
sc.frame_start, sc.frame_end = 1, NF
sc.render.fps = 30
sc.render.engine = 'CYCLES'
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = False
sc.cycles.max_bounces = 4
sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y = int(1920 * RES), int(1080 * RES)
sc.render.image_settings.file_format = 'JPEG'
sc.render.image_settings.quality = 93
sc.render.filepath = OUT + '/f'
sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'AgX - High Contrast'

PURPLE = (0.48, 0.17, 1.0, 1)

# ---- world: deep purple gradient
w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.012, 0.004, 0.03, 1); bg.inputs[1].default_value = 1.0


def mat_emit(name, col, strength):
    m = bpy.data.materials.new(name); m.use_nodes = True
    n = m.node_tree.nodes; n.clear()
    e = n.new('ShaderNodeEmission'); e.inputs[0].default_value = col; e.inputs[1].default_value = strength
    o = n.new('ShaderNodeOutputMaterial'); m.node_tree.links.new(e.outputs[0], o.inputs[0])
    return m


def mat_text():
    m = bpy.data.materials.new('TextMat'); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (0.95, 0.93, 1.0, 1)
    p.inputs['Metallic'].default_value = 0.6
    p.inputs['Roughness'].default_value = 0.18
    return m


def mat_side():
    m = bpy.data.materials.new('SideMat'); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = PURPLE
    p.inputs['Metallic'].default_value = 0.8
    p.inputs['Roughness'].default_value = 0.25
    p.inputs['Emission Color'].default_value = PURPLE
    p.inputs['Emission Strength'].default_value = 1.2
    return m

# ---- 3D title
fnt = bpy.data.fonts.load('/usr/share/fonts/opentype/inter/Inter-BlackItalic.otf')
bpy.ops.object.text_add(location=(0, 0, 0))
txt = bpy.context.object; txt.data.body = 'TOPSIDE'; txt.data.font = fnt
txt.data.align_x = 'CENTER'; txt.data.align_y = 'CENTER'
txt.data.size = 1.6; txt.data.extrude = 0.18; txt.data.bevel_depth = 0.025; txt.data.bevel_resolution = 3
txt.rotation_euler = (math.radians(90), 0, 0)
txt.data.materials.append(mat_text()); txt.data.materials.append(mat_side())
# front faces material 0, sides material 1 via extrude: Blender assigns bevel/extrude to same slot; use modifier trick
txt.active_material_index = 0

# ---- logo plane (image with alpha, emissive)
img = bpy.data.images.load('/home/user/clips/assets/logo_white.png')
bpy.ops.mesh.primitive_plane_add(size=1.25, location=(0, 0.05, 1.55))
logo = bpy.context.object; logo.rotation_euler = (math.radians(90), 0, 0)
lm = bpy.data.materials.new('Logo'); lm.use_nodes = True; lm.blend_method = 'BLEND'
nt = lm.node_tree; nt.nodes.clear()
tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img
em = nt.nodes.new('ShaderNodeEmission'); em.inputs[1].default_value = 3.0
tr = nt.nodes.new('ShaderNodeBsdfTransparent'); mix = nt.nodes.new('ShaderNodeMixShader')
out = nt.nodes.new('ShaderNodeOutputMaterial')
nt.links.new(tex.outputs['Color'], em.inputs[0]); nt.links.new(tex.outputs['Alpha'], mix.inputs[0])
nt.links.new(tr.outputs[0], mix.inputs[1]); nt.links.new(em.outputs[0], mix.inputs[2]); nt.links.new(mix.outputs[0], out.inputs[0])
logo.data.materials.append(lm)

# ---- glowing ring behind the title
bpy.ops.mesh.primitive_torus_add(major_radius=3.0, minor_radius=0.025, location=(0, 1.6, 0.3))
ring = bpy.context.object; ring.rotation_euler = (math.radians(90), 0, 0)
ring.data.materials.append(mat_emit('Ring', PURPLE, 25))

# ---- floor reflection
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, -1.15))
fl = bpy.context.object
fm = bpy.data.materials.new('Floor'); fm.use_nodes = True
fp = fm.node_tree.nodes['Principled BSDF']; fp.inputs['Base Color'].default_value = (0.01, 0.005, 0.02, 1)
fp.inputs['Roughness'].default_value = 0.12; fp.inputs['Metallic'].default_value = 0.5
fl.data.materials.append(fm)

# ---- speed streaks (emissive thin boxes flying toward camera)
streak_mat = mat_emit('Streak', (0.75, 0.65, 1.0, 1), 12)
streaks = []
for i in range(70):
    x = random.uniform(-9, 9); z = random.uniform(-3, 6)
    if abs(x) < 3.2 and -1.2 < z < 2.6:
        x += 6 * (1 if x >= 0 else -1)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, random.uniform(5, 40), z))
    s = bpy.context.object; s.scale = (0.012, random.uniform(0.6, 2.2), 0.012)
    s.data.materials.append(streak_mat); streaks.append(s)
    y0 = s.location.y; speed = random.uniform(0.6, 1.4)
    for f in (1, NF):
        s.location.y = y0 - (f - 1) * speed; s.keyframe_insert('location', index=1, frame=f)

# ---- lights
def area(loc, energy, col, size=4, rot=(0, 0, 0)):
    bpy.ops.object.light_add(type='AREA', location=loc, rotation=rot)
    l = bpy.context.object; l.data.energy = energy; l.data.color = col; l.data.size = size
    return l

key = area((-6, -6, 4), 2000, (0.6, 0.35, 1.0), 5, (math.radians(60), 0, math.radians(-45)))
rim = area((5, 4, 3), 1500, (0.55, 0.2, 1.0), 4, (math.radians(-60), 0, math.radians(135)))
sweep = area((-9, -3, 1), 2500, (1, 1, 1), 1.2, (math.radians(90), 0, math.radians(-90)))
for f, x in ((20, -9), (55, 9)):
    sweep.location.x = x; sweep.keyframe_insert('location', index=0, frame=f)

# ---- camera: fast dolly in + settle, small shake on impact
bpy.ops.object.camera_add(location=(0, -16, 0.6), rotation=(math.radians(90), 0, 0))
cam = bpy.context.object; sc.camera = cam; cam.data.lens = 40
cam.data.dof.use_dof = False
for f, y, rz in ((1, -26, 12), (14, -10.5, -2), (24, -11.2, 0), (NF, -9.6, 0)):
    cam.location.y = y; cam.rotation_euler.y = math.radians(rz)
    cam.keyframe_insert('location', index=1, frame=f); cam.keyframe_insert('rotation_euler', index=1, frame=f)
for i, f in enumerate(range(14, 22)):
    cam.location.x = (0.12 if i % 2 else -0.12) * (1 - i / 8); cam.location.z = 0.6 + (0.08 if i % 2 else -0.08) * (1 - i / 8)
    cam.keyframe_insert('location', index=0, frame=f); cam.keyframe_insert('location', index=2, frame=f)

# ---- title: slam from depth with spin; logo flips in
for f, y, rx, s in ((1, 14, 90, 2.2), (13, -0.3, 90, 1.0), (16, 0, 90, 1.0)):
    txt.location.y = y; txt.scale = (s, s, s)
    txt.keyframe_insert('location', index=1, frame=f); txt.keyframe_insert('scale', frame=f)
for f, rz in ((1, -35), (13, 0)):
    txt.rotation_euler.z = math.radians(rz); txt.keyframe_insert('rotation_euler', index=2, frame=f)
for f, rz, s in ((10, 270, 0.01), (24, 0, 1.1), (28, 0, 1.0), (NF, 12, 1.0)):
    logo.rotation_euler.z = math.radians(rz); logo.scale = (s, s, s)
    logo.keyframe_insert('rotation_euler', index=2, frame=f); logo.keyframe_insert('scale', frame=f)
for f, s in ((10, 0.2), (18, 1.0)):
    ring.scale = (s, s, s); ring.keyframe_insert('scale', frame=f)

# ---- compositor glow
sc.use_nodes = True
ct = sc.node_tree; ct.nodes.clear()
rl = ct.nodes.new('CompositorNodeRLayers')
gl = ct.nodes.new('CompositorNodeGlare'); gl.glare_type = 'FOG_GLOW'; gl.quality = 'HIGH'; gl.threshold = 0.7; gl.size = 8
co = ct.nodes.new('CompositorNodeComposite')
ct.links.new(rl.outputs['Image'], gl.inputs['Image']); ct.links.new(gl.outputs['Image'], co.inputs['Image'])

bpy.ops.render.render(animation=True)
