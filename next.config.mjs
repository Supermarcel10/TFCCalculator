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
        }, {
            source : "/:type(modpack|mod)/:name([a-zA-Z]+)/:version([0-9x_.]+)",
            destination : "/:type/:name/:version/metals",
            permanent : true
        }, {
            source : "/modpack/terrafirmagreg/1.20.x_0.10.x/:path*",
            destination : "/modpack/terrafirmagreg/1.20.x_0.10.6%2B/metals",
            permanent : true
        }]
    }
}

export default nextConfig