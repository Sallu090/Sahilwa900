from flask import Flask, request, jsonify
import requests
import os
import threading

app = Flask(__name__)

# Your existing FacebookCommenter class and logic...

@app.route('/start', methods=['POST'])
def start_commenting():
    data = request.json
    cookies = data['cookies']
    post_id = data['post_id']
    comments = data['comments']
    time_delay = data['time_delay']

    # Start the commenting process in a separate thread
    thread = threading.Thread(target=commenter.inputs, args=(cookies, post_id, comments, time_delay))
    thread.start()

    return jsonify({"message": "Commenting started!"}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
