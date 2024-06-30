document.addEventListener('DOMContentLoaded', function() {
    const updateLogs = [
        "Version 1.4 - Added save/load levels and you can share it to your friends"
    ];

    const logsList = document.getElementById('logs-list');
    updateLogs.forEach(log => {
        const listItem = document.createElement('li');
        listItem.textContent = log;
        logsList.appendChild(listItem);
    });

    const commentsList = document.getElementById('comments-list');
    const commentForm = document.getElementById('comment-form');
    const commentType = document.getElementById('comment-type');
    const commentInput = document.getElementById('comment-input');
    const commentImages = document.getElementById('comment-images');
    const submitCommentButton = document.getElementById('submit-comment');

    const levelsList = document.getElementById('levels-list');
    const uploadLevelForm = document.getElementById('upload-level-form');
    const levelFileInput = document.getElementById('level-file-input');
    const uploadLevelButton = document.getElementById('upload-level-button');

    const profanityFilter = (text) => {
        const badWords = ['badword1', 'badword2']; // Add more profanities to the list
        let filteredText = text;
        badWords.forEach(word => {
            const regex = new RegExp(word, 'gi');
            filteredText = filteredText.replace(regex, '****');
        });
        return filteredText;
    };

    const markdownParser = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/~~(.*?)~~/g, '<del>$1</del>') // Strikethrough
            .replace(/__(.*?)__/g, '<u>$1</u>'); // Underline
    };

    const saveComment = (type, text, images, parentId = null) => {
        const comments = JSON.parse(localStorage.getItem('comments')) || [];
        const commentId = Date.now().toString(); // Generate unique comment ID
        const newComment = { id: commentId, type, text, images: images || [], replies: [], parentId };
        
        if (parentId) {
            // Find parent comment and add reply
            const parentComment = comments.find(comment => comment.id === parentId);
            if (parentComment) {
                parentComment.replies.push(newComment);
            }
        } else {
            comments.push(newComment);
        }

        localStorage.setItem('comments', JSON.stringify(comments));
        return comments;
    };

    const deleteComment = (commentId) => {
        let comments = JSON.parse(localStorage.getItem('comments')) || [];

        // Function to recursively delete comment by ID
        const deleteRecursive = (commentsArray, idToDelete) => {
            return commentsArray.filter(comment => {
                if (comment.id === idToDelete) {
                    return false; // Remove comment
                } else {
                    comment.replies = deleteRecursive(comment.replies, idToDelete);
                    return true;
                }
            });
        };

        comments = deleteRecursive(comments, commentId);
        localStorage.setItem('comments', JSON.stringify(comments));
        loadComments();
    };

    const saveLevel = (fileName, fileContent) => {
        const levels = JSON.parse(localStorage.getItem('levels')) || [];
        levels.push({ fileName, fileContent });
        localStorage.setItem('levels', JSON.stringify(levels));
        return levels;
    };

    const deleteLevel = (index) => {
        let levels = JSON.parse(localStorage.getItem('levels')) || [];
        levels.splice(index, 1);
        localStorage.setItem('levels', JSON.stringify(levels));
        loadLevels();
    };

    const createCommentElement = (comment) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <strong>${comment.type}:</strong> ${markdownParser(profanityFilter(comment.text))}
            ${comment.images.map(img => `<img src="${img}" width="100">`).join('')}
            <button class="delete-button" data-comment-id="${comment.id}">Delete</button>
            <button class="reply-button" data-comment-id="${comment.id}">Reply</button>
            <ul class="replies-list">
                ${comment.replies.map(reply => createCommentElement(reply).outerHTML).join('')}
            </ul>
        `;
        return listItem;
    };

    const loadComments = () => {
        const comments = JSON.parse(localStorage.getItem('comments')) || [];
        commentsList.innerHTML = '';
        comments.forEach(comment => {
            const commentItem = createCommentElement(comment);
            commentsList.appendChild(commentItem);
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', function() {
                const commentId = this.getAttribute('data-comment-id');
                deleteComment(commentId);
            });
        });

        document.querySelectorAll('.reply-button').forEach(button => {
            button.addEventListener('click', function() {
                const commentId = this.getAttribute('data-comment-id');
                const replyText = prompt('Enter your reply:');
                if (replyText) {
                    saveComment('Reply', replyText, [], commentId);
                    loadComments();
                }
            });
        });
    };

    const loadLevels = () => {
        const levels = JSON.parse(localStorage.getItem('levels')) || [];
        levelsList.innerHTML = '';
        levels.forEach((level, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                ${level.fileName}
                <a href="${level.fileContent}" download="${level.fileName}" class="download-level-button">Download</a>
                <button class="delete-level-button" data-level-index="${index}">Delete</button>`;
            levelsList.appendChild(listItem);
        });

        document.querySelectorAll('.delete-level-button').forEach(button => {
            button.addEventListener('click', function() {
                const levelIndex = this.getAttribute('data-level-index');
                deleteLevel(levelIndex);
            });
        });
    };

    commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = commentType.value;
        const text = commentInput.value;
        const imageFiles = Array.from(commentImages.files);
        const imagePromises = imageFiles.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        Promise.all(imagePromises).then((imageDataUrls) => {
            saveComment(type, text, imageDataUrls);
            commentForm.reset();
            loadComments();
        }).catch(error => {
            console.error('Error reading image files:', error);
        });
    });

    uploadLevelForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const file = levelFileInput.files[0];
        const fileName = file.name;
        const reader = new FileReader();
        reader.onloadend = function() {
            const fileContent = reader.result;
            if (confirm(`Are you sure you want to upload '${fileName}'?`)) {
                saveLevel(fileName, fileContent);
                uploadLevelForm.reset();
                loadLevels();
            }
        };
        reader.readAsDataURL(file);
    });

    loadComments();
    loadLevels();
});
