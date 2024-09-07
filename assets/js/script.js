import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getDatabase, set, ref, push, onChildAdded, get, child, remove, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
import * as Popper from 'https://cdn.jsdelivr.net/npm/@popperjs/core@^2/dist/esm/index.js';

const firebaseConfig = {
  apiKey: "AIzaSyC58IndDeY7W4W0yrdKcvGsjsUagqXiHvs",
  authDomain: "chat-app-bbb85.firebaseapp.com",
  databaseURL: "https://chat-app-bbb85-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chat-app-bbb85",
  storageBucket: "chat-app-bbb85.appspot.com",
  messagingSenderId: "1035172672869",
  appId: "1:1035172672869:web:a04cdc572a520ef2339d8c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const dbRef = ref(getDatabase(app));
const chatsRef = ref(db, 'chats');

// Tính năng đăng ký
const formRegister = document.querySelector("#form-register");
if(formRegister) {
  formRegister.addEventListener("submit", (event) => {
    event.preventDefault();

    const fullName = formRegister.fullName.value;
    const email = formRegister.email.value;
    const password = formRegister.password.value;

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        if(user) {
          set(ref(db, 'users/' + user.uid), {
            fullName: fullName
          }).then(() => {
            window.location.href = "index.html";
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  });
}

// Tính năng đăng nhập
const formLogin = document.querySelector("#form-login");
if(formLogin) {
  formLogin.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = formLogin.email.value;
    const password = formLogin.password.value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        if(user) {
          window.location.href = "index.html";
        }
      })
      .catch((error) => {
        console.log(error);
      });
  });
}

// Tính năng đăng xuất
const buttonLogout = document.querySelector("[button-logout]");
if(buttonLogout) {
  buttonLogout.addEventListener("click", () => {
    signOut(auth).then(() => {
      window.location.href = "login.html";
    }).catch((error) => {
      console.log(error);
    });
  });
}

// Kiểm tra trạng thái đã đăng nhập hay chưa
const buttonLogin = document.querySelector("[button-login]");
const buttonRegister = document.querySelector("[button-register]");
const chat = document.querySelector(".chat");

onAuthStateChanged(auth, (user) => {
    if (user) {
        const uid = user.uid;
        console.log("Đã đăng nhập", uid);

        if (buttonLogout) {
            buttonLogout.style.display = "inline-block";
        }
        if (chat) {
            chat.style.display = "block";
        }
    } else {
        console.log("Chưa đăng nhập");

        if (buttonLogin) {
            buttonLogin.style.display = "inline-block";
        }
        if (buttonRegister) {
            buttonRegister.style.display = "inline-block";
        }
    }
});

// Chat cơ bản
const formChat = document.querySelector(".chat .inner-form");
if(formChat) {
  const upload = new FileUploadWithPreview.FileUploadWithPreview('upload-images', {
    multiple: true,
    maxFileCount: 8
  });
  const url = 'https://api.cloudinary.com/v1_1/dxhwpfxxn/image/upload';

  formChat.addEventListener("submit", async (event) => {
    event.preventDefault();

    const content = formChat.content.value;
    const userId = auth.currentUser.uid;
    const images = upload.cachedFileArray;
    const formData = new FormData();

    const arrayLinkImage = [];
    
    for (let i = 0; i < images.length; i++) {
      let file = images[i];
      formData.append('file', file);
      formData.append('upload_preset', 'yr7afv7z');

      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      arrayLinkImage.push(data.url);
    }
    
    if((content || arrayLinkImage.length > 0) && userId) {
      set(push(ref(db, "chats")), {
        content: content,
        userId: userId,
        images: arrayLinkImage
      });

      formChat.content.value = "";
      upload.resetPreviewPanel(); // clear all selected images
    }
  });
}

// Xóa tin nhắn
const buttonDeleteChat = (key) => {
  const button = document.querySelector(`[button-delete="${key}"]`);
  if(button) {
    button.addEventListener("click", () => {
      remove(ref(db, "chats/" + key));
    });
  }
};

// Lắng nghe sự kiện khi có tin nhắn bị xóa
onChildRemoved(chatsRef, (data) => {
  const key = data.key;
  const elementChatDelete = document.querySelector(`[chat-key="${key}"]`);
  if (elementChatDelete) {
    elementChatDelete.remove();
  }
});

// Lắng nghe sự kiện khi có tin nhắn bị xóa
onChildRemoved(chatsRef, (data) => {
  const key = data.key;
  const elementChatDelete = document.querySelector(`[chat-key="${key}"]`);
  if (elementChatDelete) {
    elementChatDelete.remove();
  }
});

// Lấy ra danh sách tin nhắn
const chatBody = document.querySelector(".chat .inner-body");
if(chatBody) {
  const chatsRef = ref(db, 'chats');
  onChildAdded(chatsRef, (data) => {
    const key = data.key;
    const userId = data.val().userId;
    const content = data.val().content;
    const images = data.val().images;

    get(child(dbRef, `users/${userId}`)).then((snapshot) => {
      const fullName = snapshot.val().fullName;

      const elementChat = document.createElement("div");
      elementChat.setAttribute("chat-key", key);

      let htmlFullName = '';
      let htmlButtonDelete = '';
      let htmlContent = '';
      let htmlImages = '';

      if(userId == auth.currentUser.uid) {
        elementChat.classList.add("inner-outgoing");
        htmlButtonDelete = `
          <button class="button-delete" button-delete="${key}">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        `;
      } else {
        elementChat.classList.add("inner-incoming");
        htmlFullName = `
          <div class="inner-name">
            ${fullName}
          </div>
        `;
      }

      if(content) {
        htmlContent = `
          <div class="inner-content">
            ${content}
          </div>
        `;
      }

      if(images) {
        htmlImages += `
          <div class="inner-images">
        `;

        for (const image of images) {
          htmlImages += `
            <img src="${image}" />
          `;
        }

        htmlImages += `
          </div>
        `;
      }

      elementChat.innerHTML = `
        ${htmlFullName}
        ${htmlContent}
        ${htmlImages}
        ${htmlButtonDelete}
      `;

      chatBody.appendChild(elementChat);

      buttonDeleteChat(key);

      new Viewer(elementChat);
    });
  });
}

// Chèn icon
const emojiPicker = document.querySelector('emoji-picker');
if(emojiPicker) {
  emojiPicker.addEventListener('emoji-click', (event) => {
    const icon = event.detail.unicode;

    if(icon) {
      const inputChat = document.querySelector(".chat .inner-form input[name='content']");
      inputChat.value = inputChat.value + icon;
    }
  });
}

// Hiển thị tooltip
const buttonIcon = document.querySelector('.button-icon');
if(buttonIcon) {
  const tooltip = document.querySelector('.tooltip');
  Popper.createPopper(buttonIcon, tooltip);
  
  buttonIcon.onclick = () => {
    tooltip.classList.toggle('shown');
  };

  window.addEventListener('click', function(event){   
    if (!tooltip.contains(event.target) && !buttonIcon.contains(event.target)){
      tooltip.classList.remove('shown');
    }
  });
}
// Hết Hiển thị tooltip