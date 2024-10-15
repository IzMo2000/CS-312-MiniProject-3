import bodyParser from "body-parser";
import express from "express";
import pg from "pg";
const app = express();
const port = 3000

app.use("/css",express.static("./node_modules/bootstrap/dist/css"));
app.use(bodyParser.urlencoded({ extended: true}));
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "BlogDB",
    password: "radiohead"
})

db.connect()

class Post {
    constructor(blog_id, creator_user_id, creator_name, title, body, dateTime) {
        this.blog_id = blog_id;
        this.creator_user_id = creator_user_id;
        this.creator_name = creator_name;
        this.title = title;
        this.body = body;
        this.dateTime = dateTime;
    }
}

const postResult = await db.query("SELECT * FROM blogs")
let posts = postResult.rows.map(row => {
    let post = new Post(row.blog_id, row.creator_user_id, row.creator_name, row.title, row.body, row.date_created)
    return post;
});

let loggedIn = false;
let currUserId = "";
let currName = "";

app.get("/", (req, res) => {
    if (loggedIn) {
        res.render("index.ejs", {posts: posts, userId: currUserId})
    }
    else {
        res.render("landing.ejs")
    }
})

app.get("/login", (req, res) => {
    res.render("login.ejs")
})

app.get("/signup", (req, res) => {
    res.render("signup.ejs")
})

app.get("/edit", (req, res) => {
    let postToEdit = posts.find(post => post.blog_id == req.query.blog_id)
    res.render("edit.ejs", {postToEdit: postToEdit})
})

app.post("/login", async (req, res) => {
    const userid = req.body["userid"];
    const password = req.body["password"];

    const result = await db.query(
        "SELECT user_id, password, name FROM users WHERE user_id = $1",
        [userid]
    )

    if (result.rows.length === 0) {
        res.render("login.ejs", {error: "User Not Found, Try Again"})
    }
    else {
        const user = result.rows[0];

        if (user.password !== password) {
            res.render("login.ejs", { error: "Password Was Not Correct, Try Again" });

        }
        else {
            loggedIn = true;
            currUserId = user.user_id;
            currName = user.name;
            res.redirect("/");
        }
    }
})

app.post("/signup", async (req, res) => {
    const userid = req.body["userid"];
    const name = req.body["name"];
    const password = req.body["password"];

    const result = await db.query(
        "SELECT user_id FROM users WHERE user_id = $1",
        [userid]
    )

    if (result.rows.length === 0) {
        await db.query(
            "INSERT INTO users (user_id, name, password) VALUES ($1, $2, $3)",
            [userid, name, password]
        )
        loggedIn = true;
        currUserId = userid;
        currName = name;
        res.redirect("/");
    }
    else {
        res.render("signup.ejs", {error: "User Already Exists, Try Again"})
    }
})

app.post("/make_post", async (req, res) => {
    const newPost = new Post(null, currUserId, currName, req.body.title, req.body.body, new Date());

    const result = await db.query(
        "INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created) VALUES ($1, $2, $3, $4, $5) RETURNING blog_id",
        [newPost.creator_name, newPost.creator_user_id, newPost.title, newPost.body, newPost.dateTime]
    )

    newPost.blog_id = result.rows[0].blog_id;
    posts.push(newPost);
    res.redirect("/");
});

app.post("/edit_post", async (req, res) => {
    const blogId = req.body.blog_id;
    const newTitle = req.body.title;
    const newBody = req.body.body;
    const newDateTime = new Date();

    await db.query(
        "UPDATE blogs SET title = $1, body = $2, date_created = $3 WHERE blog_id = $4",
        [newTitle, newBody, newDateTime, blogId]
    );

    let selectedPost = posts.find(post => post.blog_id == blogId)
    selectedPost.title = newTitle;
    selectedPost.body = newBody;
    selectedPost.dateTime = newDateTime;

    res.redirect("/");
});

app.post("/delete_post", async (req, res) => {
    const blogId = req.body.blog_id;
    await db.query(
        "DELETE FROM blogs WHERE blog_id = $1",
        [blogId]
    );
    posts = posts.filter(post => post.blog_id != req.body.blog_id)
    res.redirect("/");
});

app.post("/logout", (req, res) => {
    loggedIn = false;
    currName = "";
    currUserId = "";
    res.redirect("/");
})

app.listen(port, () => {
    console.log("Server running on port 3000.");
})