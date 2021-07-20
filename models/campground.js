var mongoose=require("mongoose");
campgroundSchema=new mongoose.Schema({
	name:String,
	image:String,
	price:String,
	description:String,
	author:{
		id:{
			type:mongoose.Schema.Types.ObjectId,
			ref:"user"
		},
		username:String
	},
	comments:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:"comment"
		}
	]
});
module.exports=mongoose.model("campground",campgroundSchema);