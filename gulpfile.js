
var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer'); // Zorgt dat CSS gemaakt wordt voor al de browsers.
var eslint = require('gulp-eslint');             // Code styling

var uglify = require('gulp-uglify');             // Maakt een minified bestand ervan.

var babel = require('gulp-babel');               // Cross browser.

var sourcemaps = require('gulp-sourcemaps');     // Om te kunnen debuggen.

var imagemin = require('gulp-imagemin');         // Maakt images kleiner.
var pngquant = require('imagemin-pngquant'); 

gulp.task('default',['styles', 'lint', 'copy-html','copy-images','scripts' ], function() {
	gulp.watch( 'sass/**/*.scss', ['styles']);
	gulp.watch( 'js/**/*.js', ['lint']);
    gulp.watch('/index.html', ['copy-html']);
    gulp.watch('/restaurant.html', ['copy-html']);
});

gulp.task( 'dist',['styles', 'lint', 'copy-html','images-compress','scripts-dist' ]);

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

gulp.task('scripts', function() {
	gulp.src('js/**/*.js')
		//.pipe(babel())   // Still a problem when converting static in classes.
		.pipe(gulp.dest('dist/js'));
});
gulp.task('scripts-dist', function() {
	gulp.src('js/**/*.js')
		//.pipe(babel())   // Still a problem when converting static in classes.
		.pipe(sourcemaps.init())
		//.pipe(uglify()) // Still a problem when converting static in classes.
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