export default function ContentModerationPage() {
    return (
        <div className="h-screen flex flex-col justify-start items-start space-y-7 p-2 md:p-48">
            <h1 className="text-2xl">Content Moderation Policies</h1>
            <p>
                If you have been depicted in any content and would like to appeal removal of
                such content, please notify us by email hello@fantazy.pro. If there should
                be disagreement regarding an appeal, we will allow the disagreement to be
                resolved by a neutral party.
            </p>
            <p>
                All text prompts are filtered and censored for the intention of
                sexualization of underage people, hate crime, racial discrimination, violent
                behavior, self harm. Those are done by AI (using OpenAI's content moderation
                API) and scanning for keywords.
            </p>
            <p>
                Users who repeatedly (3 times) attempt to create images of such themes will
                be banned from using the tool permanently.
            </p>
            <p>
                Users may report any inappropriate content to{" "}
                <a href="mailto:hello@fantazy.pro">hello@genfluence.ai</a> for review. We
                will respond within 24 hours. Based on the review, we will either remove the
                content/ban the creator or reject and keep the content and provide a
                response to the reporter. The creator of the reported content will also have
                72 hours to appeal the decision.
            </p>
        </div>
    );
}