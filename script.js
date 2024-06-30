document.addEventListener('DOMContentLoaded', function() {
    const updateLogs = [
        "Version 1.0 - Initial release.",
        "Version 1.1 - Bug fixes and performance improvements.",
        "Version 1.2 - Added new levels and characters."
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

    const profanityFilter = (text) => {
        const badWords = ['badword1', 'badword2']; // Add more profanities to the list
        let filteredText = text;
        badWords.forEach(word => {
            const regex = new RegExp(word, 'gi');
            filteredText = filteredText.replace(regex, '****');
        });
        return filteredText;
    };

    const parseMarkdown = (text) => {
        const replacements = [
            { regex: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' }, // Bold
            { regex: /\*(.*?)\*/g, replacement: '<em>$1</em>' }, // Italic
            { regex: /~~(.*?)~~/g, replacement: '<del>$1</del>' }, // Strikethrough
            { regex: /__(.*?)__/g, replacement: '<u>$1</u>' } // Underline
        ];

        replacements.forEach(({ regex, replacement }) => {
            text = text.replace(regex, replacement);
        });

        return text;
    };

    const saveComment = (type, text, images, replies = []) => {
        const comments = JSON.parse(localStorage.getItem('comments')) || [];
        comments.push({ type, text, images: images || [], replies });
        localStorage.setItem('comments', JSON.stringify(comments));
        return comments;
    };

    const saveReply = (index, type, text, images) => {
        let comments = JSON.parse(localStorage.getItem('comments')) || [];
        comments[index].replies = comments[index].replies || [];
        comments[index].replies.push({ type, text, images: images || [] });
        localStorage.setItem('comments', JSON.stringify(comments));
        loadComments();
    };

    const deleteComment = (index) => {
        let comments = JSON.parse(localStorage.getItem('comments')) || [];
        comments.splice(index, 1);
        localStorage.setItem('comments', JSON.stringify(comments));
        loadComments();
    };

    const loadComments = () => {
        const comments = JSON.parse(localStorage.getItem('comments')) || [];
        commentsList.innerHTML = '';
        comments.forEach((comment, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>${comment.type}:</strong> ${parseMarkdown(comment.text)}
                <div class="comment-images">
                    ${(comment.images || []).map(img => `<img src="${img}" class="comment-image">`).join('')}
                </div>
                <button class="delete-button" data-index="${index}">Delete</button>
                <button class="reply-button" data-index="${index}">Reply</button>
                <div class="reply-form" id="reply-form-${index}">
                    <textarea class="reply-input" placeholder="Type your reply here"></textarea>
                    <input type="file" class="reply-images" accept="image/*" multiple>
                    <button class="submit-reply" data-index="${index}">Submit Reply</button>
                </div>
                <ul class="replies-list">
                    ${(comment.replies || []).map((reply, replyIndex) => `
                        <li>
                            <strong>${reply.type}:</strong> ${parseMarkdown(reply.text)}
                            <div class="comment-images">
                                ${(reply.images || []).map(img => `<img src="${img}" class="comment-image">`).join('')}
                            </div>
                        </li>`).join('')}
                </ul>`;
            commentsList.appendChild(listItem);
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                deleteComment(index);
            });
        });

        document.querySelectorAll('.reply-button').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                document.getElementById(`reply-form-${index}`).style.display = 'flex';
            });
        });

        document.querySelectorAll('.submit-reply').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                const replyForm = document.getElementById(`reply-form-${index}`);
                const replyInput = replyForm.querySelector('.reply-input');
                const replyImages = replyForm.querySelector('.reply-images');
                let text = replyInput.value;
                text = profanityFilter(text);
                const images = [];

                const files = replyImages.files;
                const fileReaders = [];
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const reader = new FileReader();
                    fileReaders.push(reader);
                    reader.onloadend = function() {
                        images.push(reader.result);
                        if (images.length === files.length) {
                            saveReply(index, 'reply', text, images);
                            replyInput.value = '';
                            replyImages.value = '';
                            loadComments();
                        }
                    };
                    reader.readAsDataURL(file);
                }

                if (files.length === 0) {
                    saveReply(index, 'reply', text, images);
                    replyInput.value = '';
                    loadComments();
                }
            });
        });
    };

    submitCommentButton.addEventListener('click', () => {
        const type = commentType.value;
        let text = commentInput.value;
        text = profanityFilter(text);
        const images = [];

        const files = commentImages.files;
        const fileReaders = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            fileReaders.push(reader);
            reader.onloadend = function() {
                images.push(reader.result);
                if (images.length === files.length) {
                    saveComment(type, text, images);
                    commentInput.value = '';
                    commentImages.value = '';
                    loadComments();
                }
            };
            reader.readAsDataURL(file);
        }

        if (files.length === 0) {
            saveComment(type, text, images);
            commentInput.value = '';
            loadComments();
        }
    });

    loadComments();
});
