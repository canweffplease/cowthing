import * as THREE from 'three';

var width = window.innerWidth;
var height = window.innerHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b12);

const camera = new THREE.PerspectiveCamera( 100, width / height, 0.1, 1000 );
camera.position.z = 12;


const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( width, height ); // add (.,.,false) to render lower res with width/2 height/2 frac
document.body.appendChild( renderer.domElement ); //always have to add the renderer to dom

// lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5,5,5);
scene.add(directionalLight);

// bound
const boxsize = 10;
const half = boxsize / 2;
//walls
const bounds = {x : half, y: half, z: half};
const cowtexture = new THREE.TextureLoader().load('/cowtexture.png');

const cows = [];
const maxcows = 100;
const mincows = 1;
let isCulling = false;
const radius = 0.5;

function getRandomInt(max){
	return Math.floor(Math.random()*max);
}

function spawnCow(position, override = false){
	if (isCulling) return;
	if (cows.length >= maxcows) {
		isCulling = true;
		return;
	}
	var randInt = getRandomInt(10);
	if (randInt < 8 && override == false) return;
	const geometry = new THREE.SphereGeometry(radius, 32, 32);
  	const material = new THREE.MeshStandardMaterial({
    		map: cowtexture
  	});

  	const cow = new THREE.Mesh(geometry, material);
  	cow.position.copy(position);

  	cow.userData.velocity = new THREE.Vector3(
    		(Math.random() - 0.5) * 0.1,
    		(Math.random() - 0.5) * 0.1,
    		(Math.random() - 0.5) * 0.1
  	);

  	scene.add(cow);
  	cows.push(cow);
}

function removeCow(){
	if (cows.length <= mincows) return;
	
	var randInt = getRandomInt(10);
	if (randInt < 8) return;	
	const cow = cows.pop();
	scene.remove(cow);
	cow.geometry.dispose();
	cow.material.dispose();
}

// Spawn first cow
spawnCow(new THREE.Vector3(0, 0, 0), true);

function handleWallCollision(cow) {
  const p = cow.position;
  const v = cow.userData.velocity;
  let hitWall = false;

  ['x', 'y', 'z'].forEach(axis => {
    if (Math.abs(p[axis]) + radius > bounds[axis]) {
      v[axis] *= -1;
      p[axis] = Math.sign(p[axis]) * (bounds[axis] - radius);
      hitWall = true;
    }
  });

  //if (hitWall) {
  //  spawnCow(p.clone());
  //}
  if (!hitWall) return;
  if (isCulling){
    removeCow();
    if (cows.length <= mincows){
      isCulling = false;
    }
  }
  else
    spawnCow(p.clone());
}

function handleCowCollisions() {
  for (let i = 0; i < cows.length; i++) {
    for (let j = i + 1; j < cows.length; j++) {
      const a = cows[i];
      const b = cows[j];

      const delta = new THREE.Vector3().subVectors(b.position, a.position);
      const dist = delta.length();

      if (dist < radius * 2) {
        delta.normalize();

        const va = a.userData.velocity;
        const vb = b.userData.velocity;

        const temp = va.clone();
        va.copy(vb);
        vb.copy(temp);

        a.position.add(delta.clone().multiplyScalar(-0.05));
        b.position.add(delta.clone().multiplyScalar(0.05));
      }
    }
  }
}

let t = 0;

function animate() {
  t += 0.003;

  cows.forEach(cow => {
    cow.position.add(cow.userData.velocity);
    cow.rotation.y += 0.01;

    handleWallCollision(cow);
  });

  handleCowCollisions();

  // psychedelic color drift
  scene.background.setHSL(
    (Math.sin(t * 0.2) + 1) / 2,
    0.3,
    0.08
  );

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// --- Resize ---
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

