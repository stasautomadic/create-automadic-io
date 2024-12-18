module.exports = {
	apps: [{
		name: "nextjs-app",
		script: "npm",
		args: "run dev",
		watch: true,
		env: {
			PORT: 3002
		}
	}]
};
