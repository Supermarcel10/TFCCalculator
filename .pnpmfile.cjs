function readPackage(pkg) {
  if (pkg.dependencies) {
    if (pkg.dependencies.postcss && pkg.dependencies.postcss === '8.4.31') {
      pkg.dependencies.postcss = '8.5.25';
    }
    if (pkg.dependencies.sharp) {
      pkg.dependencies.sharp = '0.35.3';
    }
    if (pkg.dependencies.ws) {
      pkg.dependencies.ws = '>=8.21.0';
    }
    if (pkg.dependencies['brace-expansion']) {
      pkg.dependencies['brace-expansion'] = '>=5.0.8';
    }
    if (pkg.dependencies.picomatch) {
      pkg.dependencies.picomatch = '>=4.0.4';
    }
    if (pkg.dependencies['@opentelemetry/core']) {
      pkg.dependencies['@opentelemetry/core'] = '>=2.8.0';
    }
    if (pkg.dependencies['@babel/core']) {
      pkg.dependencies['@babel/core'] = '>=7.29.6 <8.0.0';
    }
  }
  if (pkg.optionalDependencies) {
    if (pkg.optionalDependencies.sharp) {
      pkg.optionalDependencies.sharp = '0.35.3';
    }
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  }
};
