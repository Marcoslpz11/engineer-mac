const maxParticleCount = 1000;

const effectController = {
	showDots: true,
	showLines: true,
	minDistance: 70,
	limitConnections: true,
	maxConnections: 6,
};

document.querySelectorAll('.three-container').forEach(container => {
	init(container);
});

function init(container) {
	let group;
	const particlesData = [];
	let camera, scene, renderer;
	let positions, colors;
	let particles;
	let pointCloud;
	let particlePositions;
	let linesMesh;
let particleCount = window.innerWidth < 500 ? 50 : 100;
	let r, rHalf;

	function updateCubeSize() {
		r = Math.min(container.clientWidth, 1080);
		rHalf = r / 2;
	}

	updateCubeSize();

	camera = new THREE.PerspectiveCamera(15, container.clientWidth / 1080, 1, 4500);
	camera.position.z = 1550;

	scene = new THREE.Scene();
	group = new THREE.Group();
	scene.add(group);

	const sprite = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png');

	const segments = maxParticleCount * maxParticleCount;
	positions = new Float32Array(segments * 3);
	colors = new Float32Array(segments * 3);

	const pMaterial = new THREE.PointsMaterial({
		color: 0xffffff,
		size: 15,
		map: sprite,
		blending: THREE.AdditiveBlending,
		transparent: true,
		alphaTest: 0.5,
		depthWrite: false
	});

	particles = new THREE.BufferGeometry();
	particlePositions = new Float32Array(maxParticleCount * 3);

	for (let i = 0; i < maxParticleCount; i++) {
		const x = Math.random() * r - rHalf;
		const y = Math.random() * r - rHalf;
		const z = 0;

		particlePositions[i * 3] = x;
		particlePositions[i * 3 + 1] = y;
		particlePositions[i * 3 + 2] = z;

		particlesData.push({
			velocity: new THREE.Vector3(-0.2 + Math.random() * 0.4, -0.1 + Math.random() * 0.2, 0),
			numConnections: 0
		});
	}

	particles.setDrawRange(0, particleCount);
	particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));

	pointCloud = new THREE.Points(particles, pMaterial);
	group.add(pointCloud);

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
	geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
	geometry.computeBoundingSphere();
	geometry.setDrawRange(0, 0);

	const material = new THREE.LineBasicMaterial({
		vertexColors: true,
		blending: THREE.AdditiveBlending,
		transparent: true
	});

	linesMesh = new THREE.LineSegments(geometry, material);
	group.add(linesMesh);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(container.clientWidth, container.clientHeight);
	const bgColor = container.classList.contains('black-bg') ? 0x000000 : 0x0C4794;
	renderer.setClearColor(bgColor, 1);
	container.appendChild(renderer.domElement);

	function animate() {
		let vertexpos = 0;
		let colorpos = 0;
		let numConnected = 0;

		for (let i = 0; i < particleCount; i++)
			particlesData[i].numConnections = 0;

		for (let i = 0; i < particleCount; i++) {
			const particleData = particlesData[i];

			particlePositions[i * 3] += particleData.velocity.x;
			particlePositions[i * 3 + 1] += particleData.velocity.y;
			particlePositions[i * 3 + 2] += particleData.velocity.z;

			if (particlePositions[i * 3] < -rHalf || particlePositions[i * 3] > rHalf)
				particleData.velocity.x = -particleData.velocity.x;

			if (particlePositions[i * 3 + 1] < -rHalf || particlePositions[i * 3 + 1] > rHalf)
				particleData.velocity.y = -particleData.velocity.y;

			if (effectController.limitConnections && particleData.numConnections >= effectController.maxConnections)
				continue;

			for (let j = i + 1; j < particleCount; j++) {
				const particleDataB = particlesData[j];

				if (effectController.limitConnections && particleDataB.numConnections >= effectController.maxConnections)
					continue;

				const dx = particlePositions[i * 3] - particlePositions[j * 3];
				const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
				const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
				const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

				if (dist < effectController.minDistance) {
					particleData.numConnections++;
					particleDataB.numConnections++;

					const alpha = 1.0 - dist / effectController.minDistance;

					positions[vertexpos++] = particlePositions[i * 3];
					positions[vertexpos++] = particlePositions[i * 3 + 1];
					positions[vertexpos++] = particlePositions[i * 3 + 2];

					positions[vertexpos++] = particlePositions[j * 3];
					positions[vertexpos++] = particlePositions[j * 3 + 1];
					positions[vertexpos++] = particlePositions[j * 3 + 2];

					colors[colorpos++] = alpha;
					colors[colorpos++] = alpha;
					colors[colorpos++] = alpha;

					colors[colorpos++] = alpha;
					colors[colorpos++] = alpha;
					colors[colorpos++] = alpha;

					numConnected++;
				}
			}
		}

		linesMesh.geometry.setDrawRange(0, numConnected * 2);
		linesMesh.geometry.attributes.position.needsUpdate = true;
		linesMesh.geometry.attributes.color.needsUpdate = true;
		pointCloud.geometry.attributes.position.needsUpdate = true;

		renderer.render(scene, camera);
		requestAnimationFrame(animate);
	}

	animate();

	window.addEventListener('resize', () => {
		updateCubeSize();
		camera.aspect = container.clientWidth / container.clientHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(container.clientWidth, container.clientHeight);
	});
}
