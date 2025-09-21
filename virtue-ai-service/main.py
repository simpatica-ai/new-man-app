from flask import Flask, request, jsonify
from google.cloud import aiplatform
from vertexai.generative_models import GenerativeModel
import vertexai
import os
import json

app = Flask(__name__)

# Initialize Vertex AI
PROJECT_ID = os.environ.get('GOOGLE_CLOUD_PROJECT')
LOCATION = 'us-central1'
vertexai.init(project=PROJECT_ID, location=LOCATION)

# Fine-tuned model endpoint (set via environment variable)
FINE_TUNED_MODEL = os.environ.get('VIRTUE_MODEL_ENDPOINT', 'gemini-1.0-pro')

@app.route('/virtue-guidance', methods=['POST'])
def virtue_guidance():
    """Replace existing Cloud Run functions with fine-tuned virtue model"""
    try:
        data = request.get_json()
        user_input = data.get('user_input', '')
        context = data.get('context', {})
        
        # Use fine-tuned model if available, otherwise base model
        model = GenerativeModel(FINE_TUNED_MODEL)
        
        # Enhanced prompt with user context
        prompt = f"""
        User Context: {json.dumps(context)}
        User Input: {user_input}
        
        Provide Socratic virtue guidance that helps reframe this situation toward virtue development.
        """
        
        response = model.generate_content(prompt)
        
        return jsonify({
            'success': True,
            'guidance': response.text,
            'model_used': FINE_TUNED_MODEL
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/journal-analysis', methods=['POST'])
def journal_analysis():
    """Analyze journal entries for virtue development insights"""
    try:
        data = request.get_json()
        journal_text = data.get('journal_text', '')
        virtue_focus = data.get('virtue_focus', '')
        
        model = GenerativeModel(FINE_TUNED_MODEL)
        
        prompt = f"""
        Analyze this journal entry for virtue development insights:
        
        Journal Entry: {journal_text}
        Current Virtue Focus: {virtue_focus}
        
        Provide:
        1. Key insights about character growth
        2. Socratic questions for deeper reflection
        3. Specific virtue development suggestions
        """
        
        response = model.generate_content(prompt)
        
        return jsonify({
            'success': True,
            'analysis': response.text,
            'model_used': FINE_TUNED_MODEL
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/assessment-guidance', methods=['POST'])
def assessment_guidance():
    """Generate personalized virtue guidance based on assessment results"""
    try:
        data = request.get_json()
        assessment_results = data.get('assessment_results', {})
        top_defects = data.get('top_defects', [])
        
        model = GenerativeModel(FINE_TUNED_MODEL)
        
        prompt = f"""
        Based on this character assessment:
        
        Assessment Results: {json.dumps(assessment_results)}
        Top Character Defects: {top_defects}
        
        Provide personalized Socratic guidance for virtue development that:
        1. Addresses the specific defects identified
        2. Suggests corresponding virtues to cultivate
        3. Offers practical daily practices
        4. Uses gentle questioning to promote self-reflection
        """
        
        response = model.generate_content(prompt)
        
        return jsonify({
            'success': True,
            'guidance': response.text,
            'model_used': FINE_TUNED_MODEL
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'model': FINE_TUNED_MODEL})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))