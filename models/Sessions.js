const mongoose=require("mongoose");
const {Schema}=mongoose;

const Sessions=new Schema({
    user_session_id:{
        type:String,
        required:true,
        unique:true
    },
    user_id:[{type:Schema.Types.ObjectId,ref:"User"}]
})

module.exports=mongoose.model('Sessions',Sessions);