var express = require("express");
var bodyParser = require("body-parser");
var passport = require("passport");
var localStrategy = require("passport-local");
var user = require("./models/user");
var expses = require("express-session");
var methodOverride = require("method-override");
var app = express();
var mongoose = require("mongoose");
var campground = require("./models/campground");
var comment = require("./models/comment");

var passportLocalMongoose = require("passport-local-mongoose");
var flash = require("connect-flash");

mongoose.connect("mongodb+srv://pavanteja:pavanteja143@cluster0-2ck8k.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true });
mongoose.connection.on("open", function () {
	console.log("mongodb connected");
});
mongoose.connection.once("error", function (error) {
	console.log("your error" + error)
});
app.use(methodOverride("_method"));
app.use(expses({
	secret: "my name is pavan",
	resave: false,
	saveUninitialized: false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(function (req, res, next) {
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	res.locals.currentUser = req.user;
	next();
})

//campground.create({name:"salmon creek",image:"https://farm9.staticflickr.com/8442/7962474612_bf2baf67c0.jpg",
//				  description:"this is most popular campground in north eastern america with full of water and breeze"});
/*var campgrounds=[{},
{name:"oati",image:"https://farm9.staticflickr.com/8442/7962474612_bf2baf67c0.jpg"},
				{name:"oati",image:"https://farm9.staticflickr.com/8442/7962474612_bf2baf67c0.jpg"}];*/
//routes
app.get("/", function (req, res) {
	res.render("landing", { currentUser: req.user });
});
function islogedin(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	else {
		req.flash("error", "please login first");
		res.redirect("/login");
	}
}
app.get("/campground", islogedin, function (req, res) {

	campground.find({}, function (err, campgrounds) {
		if (err) {
			console.log(err);
			res.redirect("back");
		}
		else {
			res.render("index", { campgrounds: campgrounds, currentUser: req.user });
		}
	});

});
app.post("/campground", islogedin, function (req, res) {
	var author = {
		id: req.user._id,
		username: req.user.username
	}
	var obj = { name: req.body.name, image: req.body.image, description: req.body.description, author: author, price: req.body.price };
	campground.create(obj);
	res.redirect("/campground");
});
app.get("/campground/new", islogedin, function (req, res) {
	res.render("new", { currentUser: req.user });
});
app.get("/campground/:id", islogedin, function (req, res) {
	campground.findById(req.params.id).populate("comments").exec(function (err, found) {
		if (err || !found) {
			console.log(err);
			res.redirect("/campground");
		}
		else {
			res.render("show", { campground: found, currentUser: req.user });
		}
	})
});
//edit routes
function checkcampgroundsOwnership(req, res, next) {
	if (req.isAuthenticated()) {
		campground.findById(req.params.id, function (err, campground) {
			if (err || !campground) {
				console.log(err);
				res.redirect("back");
			}
			else {
				if (campground.author.id.equals(req.user._id)) {
					next();
				}
				else {
					res.redirect("/campground");
				}
			}
		})

	}
	else {
		res.redirect("/login");
	}
}
app.get("/campground/:id/update", checkcampgroundsOwnership, function (req, res) {
	campground.findById(req.params.id, function (err, campground) {
		if (err || !campground) {
			console.log(err);
			res.redirect("/campground");
		}
		else {
			res.render("editform", { campground: campground, currentUser: req.user });
		}
	});
	app.put("/campground/:id", checkcampgroundsOwnership, function (req, res) {
		campground.findById(req.params.id, function (err, campground) {
			if (err || !campground) {
				console.log(err);
				res.redirect("/campground");
			}
			else {
				var obj = { name: req.body.name, image: req.body.image, description: req.body.description };
				campground.updateOne(obj, function (err) {
					if (err) {
						console.log(err);
						res.redirect("/campground");
					}
					else {
						res.redirect("/campground");
					}
				})

			}
		});
	})

})
app.delete("/campground/:id", checkcampgroundsOwnership, function (req, res) {
	campground.findById(req.params.id, function (err, campground) {
		if (err || !campground) {
			console.log(err);
			res.redirect("/campground");
		}
		else {
			var obj = { name: req.body.name, image: req.body.image, description: req.body.description };
			campground.delete(function (err) {
				if (err) {
					console.log(err);
					res.redirect("/campground");
				}
				else {
					res.redirect("/campground");
				}
			})

		}
	});
})


//comments routes
app.get("/campground/:id/comments/new", islogedin, function (req, res) {
	campground.findById(req.params.id, function (err, found) {
		if (err || !found) {
			console.log(err);
			res.redirect("back");
		}
		else {
			res.render("newcomment", { campground: found, currentUser: req.user });
		}
	});
});
app.post("/campground/:id/comments", function (req, res) {
	campground.findById(req.params.id, function (err, campground) {
		if (err || !campground) {
			console.log(err);
			res.redirect("back");
		}
		else {
			var obj = { text: req.body.text };
			comment.create(obj, function (err, comment) {
				if (err) {
					console.log(err);
					res.redirect("back");
				}
				else {
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					comment.save();
					campground.comments.push(comment);
					campground.save();
					res.redirect("/campground/" + campground._id);
				}
			})

		}
	});
});
//edit routes
function checkcommentsOwnership(req, res, next) {
	if (req.isAuthenticated()) {
		comment.findById(req.params.cid, function (err, comment) {
			if (err || !comment) {
				console.log(err);
				res.redirect("back");
			}
			else {
				if (comment.author.id.equals(req.user._id)) {
					next();
				}
				else {
					res.redirect("/campground");
				}
			}
		})

	}
	else {
		res.redirect("/login");
	}
}
app.get("/campground/:id/comments/:cid/update", function (req, res) {
	campground.findById(req.params.id, checkcommentsOwnership, function (err, campground) {
		if (err || !campground) {
			console.log(err);
			res.redirect("back");
		}
		else {
			comment.findById(req.params.cid, function (err, comment) {
				if (err || !comment) {
					console.log(err);
					res.redirect("back");
				}
				else {
					res.render("editcomment", { campground: campground, comment: comment, currentUser: req.user });
				}
			})
		}
	})

});
app.put("/campground/:id/comments/:cid", checkcommentsOwnership, function (req, res) {
	comment.findById(req.params.cid, function (err, comment) {
		if (err || !comment) {
			console.log(err);
			res.redirect("back");
		}
		else {
			var obj = { text: req.body.text }
			comment.update(obj, function (err) {
				if (err) {
					console.log(err);
					res.redirect("back");
				}
				else {
					res.redirect("/campground");
				}
			})
		}
	})
});
app.delete("/campground/:id/comments/:cid", checkcommentsOwnership, function (req, res) {
	comment.findByIdAndRemove(req.params.cid, function (err) {
		if (err) {
			console.log(err);
			res.redirect("back");
		}
		else {
			res.redirect("/campground/" + req.params.id);
		}
	})
});
//auth routes
app.get("/register", function (req, res) {
	res.render("register", { currentUser: req.user });
});
app.post("/register", function (req, res) {
	var newuser = new user({ username: req.body.username });
	user.register(newuser, req.body.password, function (err, user) {
		if (err) {
			console.log(err);
			req.flash("error", err.message);
			res.render("register");
		}
		else {

			passport.authenticate("local")(req, res, function () {
				res.redirect("/campground");
			})
		}
	})
});
app.get("/login", function (req, res) {
	res.render("login", { currentUser: req.user });
});
app.get("/logout", function (req, res) {
	req.logout();
	req.flash("success", "you logged out");
	res.redirect("/login");
});
app.post("/login", passport.authenticate("local", { successRedirect: "/campground", failureRediect: "/login" }), function (req, res) { });
const PORT = 3300;
app.listen(PORT, () => console.log(`server port ${PORT}`));