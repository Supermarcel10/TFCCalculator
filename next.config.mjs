// noinspection JSUnusedGlobalSymbols

/** @type {import("next").NextConfig} */
export default {
    devIndicators : false,
    async redirects() {
        return [{
            source : "/:type(modpack|mod)/:id([a-zA-Z]+)/:version([0-9x_.]+)/:category(alloys|metals)/:path*",
            destination : "/",
            permanent : true
        }, {
            source : "/:type(modpack|mod)/:id([a-zA-Z]+)/:version([0-9x_.]+)",
            destination : "/",
            permanent : true
        }, {
            source : "/modpack/terrafirmagreg/1.20.x_0.10.x/:path*",
            destination : "/",
            permanent : true
        }]
    }
}
