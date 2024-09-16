import bodyParser from "body-parser";
import express from "express";
const app = express();
const port = 3000

app.use("/css",express.static("./node_modules/bootstrap/dist/css"));
app.use(bodyParser.urlencoded({ extended: true}));

class Post {
    static next_id = -1
    constructor(author, title, content) {
        this.id = Post.next_id += 1;
        this.author = author;
        this.title = title;
        this.content = content;
        this.dateTime = new Date();
    }
}

let posts = [];

app.get("/", (req, res) => {
    res.render("index.ejs", {posts: posts})
})

app.get("/edit", (req, res) => {
    let postToEdit = posts.find(post => post.id == req.query.id)
    res.render("edit.ejs", {postToEdit: postToEdit})
})

app.post("/make_post", (req, res) => {
    const newPost = new Post(req.body.author, req.body.title, req.body.content);
    posts.push(newPost);
    res.redirect("/");
});

app.post("/edit_post", (req, res) => {
    let selectedPost = posts.find(post => post.id == req.body.id)
    selectedPost.author = req.body.author;
    selectedPost.title = req.body.title;
    selectedPost.content = req.body.content;
    selectedPost.dateTime = new Date();

    res.redirect("/");
});

app.post("/delete_post", (req, res) => {
    posts = posts.filter(post => post.id != req.body.id)
    res.redirect("/");
});

app.listen(port, () => {
    console.log("Server running on port 3000.");
})