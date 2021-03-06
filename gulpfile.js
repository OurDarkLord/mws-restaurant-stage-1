
var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer'); // Zorgt dat CSS gemaakt wordt voor al de browsers.
var eslint = require('gulp-eslint');             // Code styling

var concat = require('gulp-concat');             // Bundeld al de javascript, voegd functies samen etc.
var uglify = require('gulp-uglify');             // Maakt een minified bestand ervan.

var babel = require('gulp-babel');               // Cross browser.

var sourcemaps = require('gulp-sourcemaps');     // Om te kunnen debuggen.

var imagemin = require('gulp-imagemin');         // Maakt images kleiner.
var pngquant = require('imagemin-pngquant'); 

var babelify = require('babelify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

const del = require('del'); 					 //let you delete a folder.
var gzip = require('gulp-gzip'); 				 // zip files
var cleanCSS = require('gulp-clean-css');		 //minify css + backwards compatible	


gulp.task( 'delete-dist',['clean']);
gulp.task( 'build-dist',['styles', 'copy-html', 'icons-compress', 'images-compress', 'lint' ,'scripts','copy-manifest', 'build', 'idb','copy-sw']);
//gulp.task( 'build-sw',[ 'generate-service-worker']);


gulp.task('clean', function(){
	return del('dist/**', {force:true});
});

gulp.task('styles', function() {
	gulp.src('sass/**/*.scss') // Alle .scss files in de folder / sub folders.
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError)) // Zet de scss om.
		.pipe(autoprefixer({
			browsers: ['last 2 versions']
		})) // last 2 versions of all browsers prefixes fix;
		.pipe(cleanCSS({compatibility: 'ie9'}))
		.pipe(gzip())
		.pipe(gulp.dest('dist/css'));
});

gulp.task('lint',  function() {
	return gulp.src(['js/**/*.js'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failOnError());
})

gulp.task('copy-html', function() {
	gulp.src('./index.html')
        .pipe(gulp.dest('./dist'));
	gulp.src('./restaurant.html')
		.pipe(gzip())
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-manifest', function() {
	gulp.src('./manifest.json')
		.pipe(gulp.dest('./dist'));
});
gulp.task('copy-sw', function() {
	gulp.src('./sw.js')
		.pipe(gulp.dest('./dist'));
})

gulp.task('scripts', function() {
	gulp.src('js/*.js')
		.pipe(babel())   // Still a problem when converting static in classes.
		.pipe(sourcemaps.init())
		.pipe(uglify()) // Still a problem when converting static in classes.
		.pipe(sourcemaps.write())
		.pipe(gzip())
		.pipe(gulp.dest('dist/js'));
});

gulp.task('images-compress', function() {
    return gulp.src('img/*')
        .pipe(imagemin({
            progressive: true,
            use: [pngquant({quality: '10'}, {verbose: true})]
		}))
		.pipe(gzip())
        .pipe(gulp.dest('dist/img'));
});

gulp.task('icons-compress', function() {
    return gulp.src('img/icons/*')
        .pipe(imagemin({
            progressive: true,
            use: [pngquant({quality: '10'}, {verbose: true})]
		}))
		.pipe(gzip())
        .pipe(gulp.dest('dist/img/icons'));
});

gulp.task('build', function () {

	// Doesn't work that well, get some errors in browser.
	// Babel doesn't transpile it well. (in progress)

    /*return browserify({entries: 'js/common/dbhelper.js', extensions: ['.js'], debug: true})
        .transform([
			'babelify', {
				presets: ['es2015'],
				ignore: ['/src/libs/**']
			}
		])
        .bundle()
        .pipe(source('dbhelper.js'))
		.pipe(gulp.dest('dist/js'));*/
	gulp.src('js/common/*.js')
	.pipe(gzip())
	.pipe(gulp.dest('dist/js'));
		
})
gulp.task('test',['build'] , function() {
	gulp.watch( 'js/common/*.js', ['build']);
})

gulp.task('idb', function () {

	// Doesn't work that well, get some errors in browser.
	// Babel doesn't transpile it well. (in progress)

    /*return browserify({entries: 'js/common/dbhelper.js', extensions: ['.js'], debug: true})
        .transform([
			'babelify', {
				presets: ['es2015'],
				ignore: ['/src/libs/**']
			}
		])
        .bundle()
        .pipe(source('dbhelper.js'))
		.pipe(gulp.dest('dist/js'));*/
		gulp.src('node_modules/idb/lib/idb.js')
		.pipe(uglify())
		.pipe(gzip())
		.pipe(gulp.dest('dist/js'));
		
});

// Still experimental 
gulp.task('generate-service-worker', function(callback) {
	var swPrecache = require('sw-precache');
	var rootDir = 'dist';
  
	swPrecache.write(`${rootDir}/sw.js`, {
	  staticFileGlobs: [rootDir + '/**/*.{js,html,css,jpg,webp}'],
	  stripPrefix: rootDir
	}, callback);
  });
