
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
var hbsfy = require('hbsfy');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

/*gulp.task('default',['styles', 'lint', 'copy-html','copy-images','scripts' ], function() {
*///	gulp.watch( 'sass/**/*.scss', ['styles']);
//	gulp.watch( 'js/**/*.js', ['lint']);
/*    gulp.watch('/index.html', ['copy-html']);
    gulp.watch('/restaurant.html', ['copy-html']);
});*/

gulp.task( 'dist',['styles', 'copy-html','images-compress', 'lint' ,'scripts','copy-manifest', 'build', 'idb', 'copy-sw', 'copy-server']);

gulp.task('styles', function() {
	gulp.src('sass/**/*.scss') // Alle .scss files in de folder / sub folders.
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError)) // Zet de scss om.
		.pipe(autoprefixer({
			browsers: ['last 2 versions']
		})) // Laaste 2 version van alle browsers prefixes fixen.
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
		.pipe(gulp.dest('./dist'));
});
gulp.task('copy-images', function() {
	gulp.src('img/*')
		.pipe(gulp.dest('./dist/img'));
});

gulp.task('copy-manifest', function() {
	gulp.src('./manifest.json')
		.pipe(gulp.dest('./dist'));
});
gulp.task('copy-sw', function() {
	gulp.src('./sw.js')
		.pipe(gulp.dest('./dist'));
})
gulp.task('copy-server', function() {
	gulp.src('./server.js')
		.pipe(gulp.dest('./dist'));
})
gulp.task('scripts', function() {

	gulp.src('js/*.js')
		.pipe(babel())   // Still a problem when converting static in classes.
		.pipe(sourcemaps.init())
		.pipe(uglify()) // Still a problem when converting static in classes.
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/js'));
});

gulp.task('images-compress', function() {
    return gulp.src('img/*')
        .pipe(imagemin({
            progressive: true,
            use: [pngquant({quality: '50'}, {verbose: true})]
        }))
        .pipe(gulp.dest('dist/img'));
});

gulp.task('build', function () {
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
	.pipe(gulp.dest('dist/js'));
		
})
gulp.task('test',['build'] , function() {
	gulp.watch( 'js/common/*.js', ['build']);
})

gulp.task('idb', function () {
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
		.pipe(gulp.dest('dist/js'));
		
})