const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting deployment process...');

try {
    // 1. Compilar Flutter App
    console.log('\n🔨 Building Flutter Web App...');
    const flutterPath = path.join(__dirname, '../portfolio_app');

    execSync('flutter build web', {
        cwd: flutterPath,
        stdio: 'inherit'
    });
    console.log('✅ Build successful.');

    // 2. Desplegar a Firebase
    console.log('\n🔥 Deploying to Firebase Hosting...');
    const rootPath = path.join(__dirname, '..');

    // Usamos 'firebase deploy --only hosting' para no sobreescribir inadvertidamente reglas o indices si no se desea
    // Si quieres desplegar todo, quita el '--only hosting'
    execSync('firebase deploy --only hosting', {
        cwd: rootPath,
        stdio: 'inherit'
    });

    console.log('\n🎉 Deployment complete! Your app should be live soon.');

} catch (error) {
    console.error('\n❌ Deployment failed.');
    // El error detallado ya debería haber salido por stdio: inherit
    process.exit(1);
}
