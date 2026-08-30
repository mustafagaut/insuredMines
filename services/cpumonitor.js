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
    console.log(`[CPU Monitor] Started - Threshold: ${CPU_THRESHOLD}%, Check Interval: ${CHECK_INTERVAL}ms`);

    setInterval(async () => {
        try {
            const cpuUsage = await getCPUUsage();

            console.log(
                `[CPU Monitor] Current Usage: ${cpuUsage.toFixed(2)}%`
            );

            if (cpuUsage >= CPU_THRESHOLD) {
                console.error(
                    `[ALERT] CPU usage exceeded ${CPU_THRESHOLD}% (${cpuUsage.toFixed(2)}%) - Server will restart via PM2`
                );

                // PM2 will detect this exit and restart the process
                process.exit(1);
            }
        } catch (error) {
            console.error(`[CPU Monitor Error] ${error.message}`);
        }
    }, CHECK_INTERVAL);
}

module.exports = {
    startCPUMonitor,
    getCPUUsage
};