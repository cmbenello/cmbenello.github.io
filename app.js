// This part is for finding when the page is done loading
window.addEventListener("load", () => {
    const loader = document.querySelector(".loader");
    const loaderText = loader.querySelector('.loader-text');
    const loaderImage = loader.querySelector('img');
    const fadetime = 500;

    // First, fade out the text
    setTimeout(() => {
        loaderText.style.opacity = '0';
    }, fadetime * 1); 

    // Next, fade out the image after text has faded
    setTimeout(() => {
        loaderImage.style.opacity = '0';
    }, fadetime * 2); 

    // Finally, fade out the loader background after the image has faded
    setTimeout(() => {
        loader.classList.add("loader--hidden");
    }, fadetime * 3); 

    // Listener to remove the loader after the background has faded
    loader.addEventListener("transitionend", (event) => {
        if (event.target === loader) {
            document.body.removeChild(loader);
        }
    });
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        console.log(entry)
        if (entry.isIntersecting){
            entry.target.classList.add('show');
        }
         /* TODO this is for making them come again but I am not sure if the animation needs to be shown more than once */
        // else{
        //     entry.target.classList.remove('show');
        // }
    });
})
const hiddenElements = document.querySelectorAll('.hidden');
hiddenElements.forEach((el) => observer.observe(el));


// Get all the buttons that open modals
var btns = document.querySelectorAll(".readMoreBtn");

// Get all the <span> elements that close the modals
var spans = document.getElementsByClassName("close");

// Function to open modal
function openModal(modal) {
    if (modal == null) return;
    modal.style.display = "block";
}

// Function to close modal
function closeModal(modal) {
    if (modal == null) return;
    modal.style.display = "none";
}

// Loop through the buttons and add event listeners
btns.forEach(btn => {
    btn.addEventListener('click', () => {
        var modal = document.querySelector(btn.getAttribute('data-modal-target'));
        openModal(modal);
    });
});

// Add event listener to close buttons
Array.from(spans).forEach(span => {
    span.addEventListener('click', () => {
        var modal = span.closest('.modal');
        closeModal(modal);
    });
});

// Close modal when clicking outside of it
window.addEventListener('click', event => {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target);
    }
});

