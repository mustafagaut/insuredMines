const os = require("os");

const CPU_THRESHOLD = 70;
const CHECK_INTERVAL = 5000;

function getCPUUsage() {
    return new Promise((resolve) => {
        const start = os.cpus();

        setTimeout(() => {
            const end = os.cpus();

            let idle = 0;
            let total = 0;

            for (let i = 0; i < start.length; i++) {
                const startCPU = start[i].times;
                const endCPU = end[i].times;

                const startTotal =
                    startCPU.user +
                    startCPU.nice +
                    startCPU.sys +
                    startCPU.idle +
                    startCPU.irq;

                const endTotal =
                    endCPU.user +
                    endCPU.nice +
                    endCPU.sys +
                    endCPU.idle +
                    endCPU.irq;

                idle += endCPU.idle - startCPU.idle;
                total += endTotal - startTotal;
            }

            const usage = (1 - idle / total) * 100;

            resolve(usage);
        }, 1000);
    });
}

function startCPUMonitor() {
    console.log("CPU monitor started");

    setInterval(async () => {
        try {
            const cpuUsage = await getCPUUsage();

            console.log(
                `CPU Usage: ${cpuUsage.toFixed(2)}%`
            );

            if (cpuUsage >= CPU_THRESHOLD) {
                console.log(
                    `CPU usage exceeded ${CPU_THRESHOLD}%`
                );

                process.exit(1);
            }
        } catch (error) {
            console.error("CPU monitor error:", error);
        }
    }, CHECK_INTERVAL);
}

module.exports = {
    startCPUMonitor,
    getCPUUsage
};