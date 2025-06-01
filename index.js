// Application State (using in-memory storage)
let currentUser = null;
let users = [];
let posts = [];
let currentEditingPost = null;

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  checkAuthState();
  renderPosts();
  setupEventListeners();
});

function setupEventListeners() {
  // Auth forms
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document
    .getElementById("signupForm")
    .addEventListener("submit", handleSignup);
  document
    .getElementById("postForm")
    .addEventListener("submit", handlePostSubmit);

  // Close modals on outside click
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeModal(this.id);
      }
    });
  });
}

// Authentication functions
function checkAuthState() {
  showGuestUI();
}

function showAuthenticatedUI() {
  document.getElementById("welcomeSection").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("authNav").classList.remove("hidden");
  document.getElementById("guestNav").classList.add("hidden");
  document.getElementById(
    "userGreeting"
  ).textContent = `Welcome, ${currentUser.name}!`;
  updateDashboardStats();
}

function showGuestUI() {
  document.getElementById("welcomeSection").classList.remove("hidden");
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("authNav").classList.add("hidden");
  document.getElementById("guestNav").classList.remove("hidden");
}

function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  // Check if user already exists
  if (users.find((user) => user.email === email)) {
    alert("User with this email already exists!");
    return;
  }

  // Create new user
  const newUser = {
    id: Date.now(),
    name,
    email,
    password, // In real app, this would be hashed
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  // Data persisted in memory for this session

  // Auto login
  currentUser = newUser;

  closeModal("signupModal");
  showAuthenticatedUI();
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const user = users.find(
    (user) => user.email === email && user.password === password
  );

  if (user) {
    currentUser = user;
    closeModal("loginModal");
    showAuthenticatedUI();
  } else {
    alert("Invalid email or password!");
  }
}

function logout() {
  currentUser = null;
  showGuestUI();
  renderPosts();
}

// Post CRUD functions
function handlePostSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("postTitle").value;
  const content = document.getElementById("postContent").value;

  if (currentEditingPost) {
    // Update existing post
    const postIndex = posts.findIndex(
      (post) => post.id === currentEditingPost.id
    );
    posts[postIndex] = {
      ...posts[postIndex],
      title,
      content,
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Create new post
    const newPost = {
      id: Date.now(),
      title,
      content,
      author: currentUser.name,
      authorId: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    posts.unshift(newPost);
  }

  // Data persisted in memory for this session
  closeModal("postModal");
  renderPosts();
  updateDashboardStats();

  // Reset form
  document.getElementById("postForm").reset();
  currentEditingPost = null;
}

function editPost(postId) {
  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  currentEditingPost = post;
  document.getElementById("postModalTitle").textContent = "Edit Post";
  document.getElementById("postSubmitBtn").textContent = "Update Post";
  document.getElementById("postTitle").value = post.title;
  document.getElementById("postContent").value = post.content;

  showModal("postModal");
}

function deletePost(postId) {
  if (confirm("Are you sure you want to delete this post?")) {
    posts = posts.filter((post) => post.id !== postId);
    renderPosts();
    updateDashboardStats();
  }
}

function renderPosts() {
  const postsGrid = document.getElementById("postsGrid");

  if (posts.length === 0) {
    postsGrid.innerHTML = `
                    <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                        <h3 style="margin-bottom: 1rem; color: var(--text-muted);">No posts yet</h3>
                        <p style="color: var(--text-muted);">Be the first to share your thoughts!</p>
                    </div>
                `;
    return;
  }

  postsGrid.innerHTML = posts
    .map(
      (post) => `
                <article class="post-card fade-in">
                    <div class="post-header">
                        <h3 class="post-title">${escapeHtml(post.title)}</h3>
                        <div class="post-meta">
                            <span>By ${escapeHtml(post.author)}</span>
                            <span>${formatDate(post.createdAt)}</span>
                        </div>
                    </div>
                    <div class="post-content">
                        <p>${escapeHtml(post.content.substring(0, 150))}${
        post.content.length > 150 ? "..." : ""
      }</p>
                    </div>
                    ${
                      currentUser && currentUser.id === post.authorId
                        ? `
                        <div class="post-actions">
                            <button class="btn btn-secondary" onclick="editPost(${post.id})" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Edit</button>
                            <button class="btn btn-danger" onclick="deletePost(${post.id})" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Delete</button>
                        </div>
                    `
                        : ""
                    }
                </article>
            `
    )
    .join("");
}

// Modal functions
function showModal(modalId) {
  document.getElementById(modalId).classList.add("active");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active");
}

function showLogin() {
  document.getElementById("loginForm").reset();
  showModal("loginModal");
}

function showSignup() {
  document.getElementById("signupForm").reset();
  showModal("signupModal");
}

function showCreatePost() {
  if (!currentUser) {
    alert("Please login to create a post");
    return;
  }

  currentEditingPost = null;
  document.getElementById("postModalTitle").textContent = "Create New Post";
  document.getElementById("postSubmitBtn").textContent = "Create Post";
  document.getElementById("postForm").reset();
  showModal("postModal");
}

// Utility functions
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function updateDashboardStats() {
  if (!currentUser) return;

  document.getElementById("totalPosts").textContent = posts.length;
  document.getElementById("myPosts").textContent = posts.filter(
    (post) => post.authorId === currentUser.id
  ).length;
  document.getElementById("totalUsers").textContent = users.length;
}

// Demo data for testing
function loadDemoData() {
  if (posts.length === 0) {
    const demoPosts = [
      {
        id: 1,
        title: "Welcome to BlogHub",
        content:
          "This is a sample blog post to demonstrate the platform. You can create, edit, and delete your own posts once you sign up! The platform features a modern design with glassmorphism effects, smooth animations, and a fully responsive layout.",
        author: "BlogHub Team",
        authorId: 0,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 2,
        title: "Getting Started with Blogging",
        content:
          "Blogging is a great way to share your thoughts and connect with others. Here are some tips to get you started: 1. Write about what you're passionate about, 2. Be consistent with your posting schedule, 3. Engage with your readers through comments and social media. Remember that great content takes time to develop!",
        author: "BlogHub Team",
        authorId: 0,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 3,
        title: "The Future of Web Development",
        content:
          "Web development is constantly evolving with new technologies and frameworks. From AI-powered tools to advanced CSS features, developers have more capabilities than ever before. The focus is shifting towards creating more accessible, performant, and user-friendly experiences.",
        author: "BlogHub Team",
        authorId: 0,
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 259200000).toISOString(),
      },
    ];

    posts = demoPosts;
    renderPosts();
  }
}

// Load demo data on first visit
loadDemoData();
