# Pattern library / 80 presets

**English** · [한국어](PATTERNS-KR.md) · [README](../README.md)

Each preset has its own construction and editable GLSL source. The tables list shape controls; common zoom, rotation, phase, seed, palettes, layer blending and finish effects are also available.

Tesseract, 16-cell and 24-cell presets rotate genuine 4D vertices and edges before 3D and screen projection. Meshes and knots are procedural 3D line structures; Menger sponge, Mandelbulb, octahedral crystal and harmonic shell use ray marching.

The 5-cell is a regular 4D simplex with five equidistant vertices and ten edges. Hopf fibers are actual linked circles obtained from the 3-sphere by stereographic projection. The Klein bottle is a self-intersecting 3D immersion, the catenoid–helicoid preset uses the associate-family equations, and the Dupin cyclide is a sphere inversion of a torus. These presets draw sampled wire meshes, rather than opaque triangle meshes.

Koch, dragon, Hilbert and Gosper curves use distinct finite L-system rules with their coordinates embedded in the editable shader. Pythagoras branches follow the right-triangle square construction. High recursion depths increase GPU work. Penrose uses a finite P3 rhombus patch from Robinson subdivision; hyperbolic tiling supports only valid `{p,3}` combinations with `p = 7–10`; Hankin stars use an octagon/square 4.8.8 tiling. Fourier paths use integer harmonics. Pendulum waves prescribe harmonic motion, not nonlinear physical simulation; short durations cap the integer frequencies, so some pendulums can share a frequency. Reuleaux rotation maintains a constant-width bounding box.

Default animations use periodic angles and cyclic coordinates. Loop inspection compares low-resolution samples; fine lines and deep fractals can show floating-point or sampling differences.

## Fractals (23)

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
| Koch snowflake | koch | Recursion depth · Curve width · Zoom breathing |
| Heighway dragon | dragon | Recursion depth · Curve width · Zoom breathing |
| Hilbert path | hilbert | Recursion depth · Curve width · Zoom breathing |
| Peano-Gosper curve | gosper | Recursion depth · Curve width · Zoom breathing |
| Pythagoras tree | pythagoras-tree | Recursion depth · Branch angle · Square outline · Branch sway |

## Geometric motion (29)

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
| Penrose rhombi | penrose | Tile subdivision depth · Tile patch size · Tile edge width |
| Hyperbolic tessellation | hyperbolic | Polygon sides · Disk orbit radius · Geodesic width |
| Hankin star lattice | islamic-stars | Lattice density · Ribbon contact angle · Ribbon width |
| Fourier epicycles | fourier-epicycles | Harmonics · Harmonic falloff · Relative harmonic phase |
| Pendulum waves | pendulum-waves | Pendulums · Swing amplitude · Base oscillations |
| Reuleaux rotor | reuleaux | Constant width · Outline width · Generating triangle |

## 3D surfaces and projections (19)

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
| Klein bottle immersion | klein-bottle | Bottle center radius · Figure-eight section size · Section breathing |
| Catenoid–helicoid morph | catenoid-helicoid | Surface neck radius · Surface extent · Minimal-surface morph · Minimal-surface morph travel |
| Dupin inversion cyclide | cyclide | Torus major radius · Torus minor radius · Inversion center offset · Inversion sphere radius |
| Hopf linked fibers | hopf-fibers | Hopf fiber count · Base-sphere polar angle · Base-sphere polar travel · Hopf fiber width |
| 5-cell / 4D simplex | five-cell | Simplex projection distance · Simplex 4D tilt · Simplex size · Simplex edge width |

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

## Construction references

- [L-system rules and implementation](https://robertdickau.com/lsys2d.html), [Pythagoras tree construction](https://www.ntg.nl/maps/44/06.pdf)
- [Penrose Robinson subdivision](https://preshing.com/20110831/penrose-tiling-explained/), [Islamic star patterns and non-Euclidean tilings](https://cs.uwaterloo.ca/~csk/publications/Papers/kaplan_salesin_2004_b.pdf)
- [Pendulum waves](https://sciencedemonstrations.fas.harvard.edu/presentations/pendulum-waves), [Reuleaux construction and animation](https://pytamaro.si.usi.ch/activities/luce/reuleaux-triangle/en/v1)
- [Klein bottle immersion](https://virtualmathmuseum.org/Surface/klein_bottle/klein_bottle.html), [catenoid–helicoid equations](https://www.math.uci.edu/~vmm/Surface/helicoid-catenoid/helicoid-catenoid.html), [cyclides and Clifford tori](https://www.math.uci.edu/~vmm/docs/Clifford_Tori.pdf)
- [Hopf fiber construction](https://nilesjohnson.net/hopf-production.html), [regular 4D polytopes and projections](https://sschleimer.warwick.ac.uk/Maths/2015puzzling_120.pdf)
