function readPackage(pkg) {
  if (pkg.dependencies) {
    if (pkg.dependencies.postcss && pkg.dependencies.postcss === '8.4.31') {
      pkg.dependencies.postcss = '8.5.25';
    }
    if (pkg.dependencies.sharp) {
      pkg.dependencies.sharp = '0.35.3';
    }
    if (pkg.dependencies['brace-expansion']) {
      pkg.dependencies['brace-expansion'] = '>=5.0.8';
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
