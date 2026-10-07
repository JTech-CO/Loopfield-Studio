# Pattern library / 64 presets

**English** · [한국어](PATTERNS-KR.md) · [README](../README.md)

Each preset has its own construction and editable GLSL source. The tables list shape controls; common zoom, rotation, phase, seed, palettes, layer blending and finish effects are also available.

Tesseract, 16-cell and 24-cell presets rotate genuine 4D vertices and edges before 3D and screen projection. Meshes and knots are procedural 3D line structures; Menger sponge, Mandelbulb, octahedral crystal and harmonic shell use ray marching.

Default animations use periodic angles and cyclic coordinates. Loop inspection compares low-resolution samples; fine lines and deep fractals can show floating-point or sampling differences.

## Fractals (18)

| Name | ID | Shape controls |
|---|---|---|
| Mandelbrot | mandelbrot | Iteration limit · Zoom breathing · Contour density |
| Julia orbit | julia | Iteration limit · c Real part · c Imaginary part · Orbit radius |
| Burning Ship | burning-ship | Iteration limit · Zoom breathing |
| Cubic Multibrot | multibrot | Iteration limit · Zoom breathing |
| Newton basins | newton | Iteration limit · Camera orbit |
| Sierpinski fold | sierpinski | Recursion depth |
| Tricorn mirror | tricorn | Iteration limit · Zoom breathing · Contour density |
| Phoenix memory | phoenix | Iteration limit · Memory coefficient · Complex constant |
| Magnet attractor | magnet | Iteration limit · c Real part · Orbit radius |
| Lyapunov atlas | lyapunov | Iteration limit · Logistic center · Coefficient span |
| Sierpinski carpet | sierpinski-carpet | Recursion depth · Zoom breathing |
| Vicsek cross | vicsek | Recursion depth · Rocking angle |
| Cantor dust | cantor-dust | Recursion depth · Zoom breathing |
| Inversion circle packing | apollonian | Recursion depth · Inversion scale |
| Kleinian mirror | kleinian | Recursion depth · Mirror spacing · Inversion height |
| Levy C curve | levy-curve | Recursion depth · Trail width |
| Menger sponge | menger | Recursion depth · Model size |
| Mandelbulb sculpture | mandelbulb | Fractal power · Iteration limit |

## Geometric motion (23)

| Name | ID | Shape controls |
|---|---|---|
| Prism Bloom | prism | Symmetry · Light bands · Twist |
| Kaleido tiles | kaleido | Folds · Tile density · Iteration depth |
| Moiré study | moire | Grid density · Crossing angle |
| Wave interference | interference | Wave frequency · Source distance |
| Orbital rings | orbital | Orbit count · Orbit tilt |
| Logarithmic spiral | spiral | Spiral arms · Winding density |
| Truchet circuit | truchet | Tile density · Circuit width |
| Hexagonal pulse | hex-pulse | Honeycomb density · Wave density |
| Polar lattice | polar-lattice | Radial spokes · Circle density |
| Rhodonea garden | rose | Petals · Layers |
| Lissajous signal | lissajous | Horizontal frequency · Vertical frequency · Trail width |
| Concentric grid | concentric-grid | Grid density · Concentric rings |
| Quasicrystal interference | quasicrystal | Wave directions · Spatial frequency |
| Epicycloid wheel | epicycloid | Cusp count · Trail width |
| Hypotrochoid spirograph | hypotrochoid | Rolling radius ratio · Pen offset · Trail width |
| Superformula bloom | superformula | Petals · Surface exponent · Outline pinch · Morph |
| Phyllotaxis seeds | phyllotaxis | Seed count · Seed radius · Zoom breathing |
| Chladni resonance | chladni | Horizontal mode · Vertical mode · Mode mix |
| Mobius conformal grid | conformal-grid | Grid density · Transform strength · Grid width |
| Braided ribbons | braided-ribbons | Ribbon strands · Braid density · Ribbon width |
| Modular chord web | chord-web | Chord points · Chord multiplier · Line width |
| Radial gear train | gear-train | Gear teeth · Tooth depth · Gear spokes |
| Origami folding fan | origami-fan | Fold panels · Fold height · Fan radius |

## 3D surfaces and projections (14)

| Name | ID | Shape controls |
|---|---|---|
| Gyroid sculpture | gyroid | Surface frequency · Surface thickness |
| Twisted torus | torus | Ring thickness · Surface twist |
| Morphing superellipsoid | superquadric | Surface exponent · Morph |
| Schwarz P surface | schwarz | Surface frequency · Wall width |
| Tesseract / 4D hypercube | tesseract | 4D projection distance · 4D tilt · Model size · Edge width |
| 16-cell / 4D cross-polytope | sixteen-cell | 4D projection distance · 4D tilt · Model size · Edge width |
| 24-cell / 4D lattice | twenty-four-cell | 4D projection distance · 4D tilt · Model size · Edge width |
| Icosahedron cage | icosahedron | Model size · Edge width |
| Torus knot | torus-knot | Ring windings · Tube windings · Knot relief · Trail width |
| Mobius strip mesh | mobius-strip | Mesh divisions · Band width |
| Enneper saddle | enneper | Mesh divisions · Surface extent |
| Dini spiral surface | dini | Mesh divisions · Spiral turns · Spiral pitch |
| Hollow octahedral crystal | octahedron | Cavity radius · Edge rounding |
| Spherical harmonic shell | harmonic-sphere | Longitude lobes · Latitude bands · Surface relief |

## Organic patterns (8)

| Name | ID | Shape controls |
|---|---|---|
| Silk contours | ribbons | Line density · Ripple strength · Line width |
| Cellular glass | voronoi | Cell density · Motion |
| Liquid topography | domain | Terrain scale · Distortion · Contour count |
| Aurora curtains | aurora | Curtain layers · Flow strength |
| Water caustics | caustics | Wavefront density · Light focus |
| Metaball islands | metaballs | Particle count · Particle size |
| Topographic dunes | contour-waves | Contour count · Terrain relief |
| Harmonic plasma | plasma | Wave density · Color bands |

## Code starting point (1)

| Name | ID | Shape controls |
|---|---|---|
| Your first loop | starter | Circle density |
