from flask import Flask, request, jsonify, render_template, redirect, url_for, session, flash
from flask_mysqldb import MySQL
from werkzeug.security import generate_password_hash, check_password_hash
import logging
from MySQLdb import IntegrityError

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__, static_folder='/home/muxe/Documents/taxE/src/frontend/static', 
            template_folder='/home/muxe/Documents/taxE/src/frontend/templates')

# Secret key for session management
app.secret_key = 'Muxe@2001'  # Set a secure secret key

# MySQL Configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'Muxe@2001'
app.config['MYSQL_DB'] = 'taxE'

mysql = MySQL(app)

@app.route('/')
def home():
    logging.debug("Rendering home page")
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        logging.debug(f"Login attempt for email: {email}")

        cur = mysql.connection.cursor()
        cur.execute("SELECT id, password_hash, role FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()

        if user:
            user_id, password_hash, role = user
            if check_password_hash(password_hash, password):
                session['user_id'] = user_id
                session['email'] = email
                session['role'] = role
                logging.debug(f"Login successful for user_id: {user_id}")
                return jsonify({'success': True, 'message': 'Login successful!'})
            else:
                logging.warning(f"Invalid password for email: {email}")
                return jsonify({'success': False, 'message': 'Invalid password.'})
        else:
            logging.warning(f"Email not found: {email}")
            return jsonify({'success': False, 'message': 'Email not found.'})
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        phone = request.form.get('phone')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        logging.debug(f"Signup attempt for email: {email}")

        if password != confirm_password:
            logging.warning("Passwords do not match")
            flash('Passwords do not match!', 'danger')  # Add flash message
            return render_template('signup.html')

        password_hash = generate_password_hash(password)
        role = 'rider'  # Default role for new users

        cur = mysql.connection.cursor()
        try:
            cur.execute("INSERT INTO users (name, email, phone, password_hash, role) VALUES (%s, %s, %s, %s, %s)",
                        (name, email, phone, password_hash, role))
            mysql.connection.commit()
            cur.close()

            session['email'] = email
            logging.debug(f"Signup successful for email: {email}")
            flash('Signup successful! You can now log in.', 'success')
            return redirect(url_for('login'))
        except IntegrityError as e:
            mysql.connection.rollback()
            logging.error(f"Signup error: {e}")
            flash('Error: Email or Phone already exists!', 'danger')
            return render_template('signup.html')

    return render_template('signup.html')


@app.route('/user_home')
def user_home():
    if 'email' not in session:
        logging.warning("User not logged in, redirecting to login")
        flash("Please log in first.", "warning")
        return redirect(url_for('login'))
    logging.debug(f"Rendering user home for email: {session['email']}")
    return render_template('user_home.html', email=session['email'], role=session.get('role', 'rider'))

@app.route('/logout')
def logout():
    logging.debug(f"User logged out: {session.get('email')}")
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for('login'))

@app.route('/account')
def account():
    if 'user_id' not in session:
        logging.warning("User not logged in, redirecting to login")
        flash("Please log in first.", "warning")
        return redirect(url_for('login'))

    user_id = session['user_id']
    logging.debug(f"Fetching account details for user_id: {user_id}")
    
    with mysql.connection.cursor() as cur:
        cur.execute("SELECT name, email, phone FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
    
    if user:
        name, email, phone = user
        logging.debug(f"Rendering account page for user_id: {user_id}")
        return render_template('account.html', name=name, email=email, phone=phone)
    
    logging.error(f"User not found for user_id: {user_id}")
    flash("User not found.", "danger")
    return redirect(url_for('login'))


@app.route('/activity')
def activity():
    if 'user_id' not in session:
        logging.warning("User not logged in, redirecting to login")
        flash("Please log in first.", "warning")
        return redirect(url_for('login'))

    user_id = session['user_id']
    logging.debug(f"Fetching activity for user_id: {user_id}")

    cur = mysql.connection.cursor()
    cur.execute("SELECT created_at FROM users WHERE id = %s", (user_id,))
    created_at = cur.fetchone()[0]  # Fetch the timestamp
    cur.close()

    logging.debug(f"Rendering activity page for user_id: {user_id}")
    return render_template('activity.html', created_at=created_at)

if __name__ == '__main__':
    logging.debug("Starting Flask application")
    app.run(debug=True)