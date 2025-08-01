/** @type {import("next").NextConfig} */
const nextConfig = {
    devIndicators : false,
    async redirects() {
        return [{
            source : "/modpack/terrafirmagreg/1.20.x_0.7.14/alloys/:path*",
            destination : "/modpack/terrafirmagreg/1.20.x_0.7.x/metals/:path*",
            permanent : true
        }, {
            source : "/modpack/terrafirmagreg/1.20.x_0.7.14/metals/:path*",
            destination : "/modpack/terrafirmagreg/1.20.x_0.7.x/metals/:path*",
            permanent : true
        }]
    }
}

export default nextConfig