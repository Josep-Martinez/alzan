const {
    withAppBuildGradle,
    withGradleProperties,
} = require('expo/config-plugins');

const withOptimizedR8 = (config) => {
    // 1. Inject 'android.r8.optimizedResourceShrinking=true' into gradle.properties
    config = withGradleProperties(config, (config) => {
        const property = {
            type: 'property',
            key: 'android.r8.optimizedResourceShrinking',
            value: 'true',
        };
        // Remove if exists to avoid duplicates (simplified approach for properties array)
        config.modResults = config.modResults.filter(
            (item) => item.key !== property.key
        );
        config.modResults.push(property);
        return config;
    });

    // 2. Replace 'proguard-android.txt' with 'proguard-android-optimize.txt' in app/build.gradle
    config = withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = config.modResults.contents.replace(
                'proguard-android.txt',
                'proguard-android-optimize.txt'
            );
        }
        return config;
    });

    return config;
};

module.exports = withOptimizedR8;
