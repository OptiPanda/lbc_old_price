function applyTag4Favorites() {
    const propsContainer = document.querySelectorAll('[data-test-id="adcard-outlined"] [class^="adcard_"] .mt-md.gap-md.flex.flex-col.justify-between');
    const dateList = Array.from(propsContainer).map(_ => _.querySelector('p.text-caption.text-neutral:nth-child(5)'));

    propsContainer.forEach(propContainer => {
        const date = propContainer.querySelector('p.text-caption.text-neutral:nth-child(5)');
        const dateClean = parseDate(date.innerHTML);
        date.remove();

        const dateTag = createDateTag("Déposée le ", dateClean, false);
        let tagListContainer, no_delivery;

        if (propContainer.childNodes.length === 1) {
            tagListContainer = document.createElement("div");
            tagListContainer.setAttribute("class", "gap-md flex flex-wrap items-center mb-md");

            no_delivery = createTag("Non livrable", "text-on-main bg-main");
            tagListContainer.appendChild(no_delivery)

            propContainer.insertBefore(tagListContainer, propContainer.firstChild)
        }
        if (!tagListContainer) {
            tagListContainer = propContainer.firstChild;
        }
        tagListContainer.appendChild(dateTag)
    })

    dateList.forEach(date => {
        date.remove();
    })
}