/*
 * TODO: This component is the popup that should appear when the user clicks on
 * the "forgot password" button on the login page.
 */
function ForgotPasswordModal() {
    return (
        <div></div>
    );
}

/*
 * TODO: This function is the top level component of the login page. All of the
 * JSX returned by this function will be rendered on the /login route. Complete
 * the component to match the designs provided in the ticket.
 */
export default function LogIn() {
    return (
        <main>
            {/* we use components within our JSX similarly to html tags*/}
            <ForgotPasswordModal />
        </main>
    );
}
