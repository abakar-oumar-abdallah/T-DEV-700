const speakeasy = require('speakeasy');

class TotpController {
  constructor() {
    // Stockage en mémoire des secrets par équipe (en production, utiliser une base de données)
    this.teamSecrets = new Map();
    // Référence au serveur WebSocket (sera injectée)
    this.io = null;
  }

  /**
   * Initialiser le serveur WebSocket
   */
  setSocketServer(io) {
    this.io = io;
  }

  /**
   * Génère un code TOTP pour une équipe et l'envoie via WebSocket
   */
  async generateTotp(req, res) {
    try {
      const { teamId } = req.params;

      if (!teamId) {
        return res.status(400).json({
          success: false,
          message: 'Team ID is required'
        });
      }

      // Récupérer ou créer un secret pour l'équipe
      let secret = this.teamSecrets.get(teamId);
      
      if (!secret) {
        // Générer un nouveau secret pour l'équipe
        const generated = speakeasy.generateSecret({
          name: `Team ${teamId}`,
          length: 32,
        });
        secret = generated.base32;
        this.teamSecrets.set(teamId, secret);
      }

      // Générer le code TOTP
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
        step: 30, // Code valide pendant 30 secondes
      });

      // Calculer le temps restant avant expiration
      const timeRemaining = 30 - (Math.floor(Date.now() / 1000) % 30);

      // Émettre le code via WebSocket si disponible
      if (this.io) {
        this.io.emit(`totp:${teamId}`, {
          teamId,
          code: token,
          expiresIn: timeRemaining,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(200).json({
        success: true,
        message: 'Code TOTP généré et envoyé via WebSocket',
        data: {
          teamId,
          code: token,
          expiresIn: timeRemaining,
        },
      });

    } catch (err) {
      console.error('Unexpected error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    }
  }
    
  /**
   * Vérifie un code TOTP pour une équipe
   */
  async verifyTotp(req, res) {
    try {
      const { teamId } = req.params;
      const { code } = req.body;

      // Vérifier que les paramètres sont fournis
      if (!teamId) {
        return res.status(400).json({
          success: false,
          message: 'Team ID is required'
        });
      }

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'TOTP code is required'
        });
      }

      // Validate code format
      if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({
          success: false,
          message: 'TOTP code must be exactly 6 digits'
        });
      }

      console.log(`Verifying TOTP code ${code} for team ${teamId}`);

      // Récupérer le secret de l'équipe
      const secret = this.teamSecrets.get(teamId);
      
      if (!secret) {
        console.log(`No TOTP secret found for team ${teamId}`);
        return res.status(404).json({
          success: false,
          message: `No TOTP secret found for team ${teamId}. Please generate a TOTP code first.`
        });
      }

      // Vérifier le code TOTP (avec une fenêtre de tolérance de ±1 période)
      const isValid = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: code,
        step: 30,
        window: 2, // Accepte les codes de 2 périodes avant/après (±60 secondes)
      });

      console.log(`TOTP verification result for team ${teamId}: ${isValid ? 'VALID' : 'INVALID'}`);

      // Emission résultat si socket disponible
      if (this.io) {
        this.io.to(`team:${teamId}`).emit(`totp:verify:${teamId}`, {
          teamId,
          code,
          isValid,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(200).json({
        success: true,
        message: isValid ? 'Valid TOTP' : 'Invalid or expired TOTP code',
        data: {
          teamId,
          isValid, 
          code,
          timestamp: new Date().toISOString()
        },
      });

    } catch (err) {
      console.error('TOTP verification error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error during TOTP verification',
        error: err.message
      });
    }
  }

  /**
   * Réinitialise le secret d'une équipe
   */
  async resetTeamSecret(req, res) {
    try {
      const { teamId } = req.params;

      if (!teamId) {
        return res.status(400).json({
          success: false,
          message: 'Team ID is required'
        });
      }

      const secretExisted = this.teamSecrets.has(teamId);
      this.teamSecrets.delete(teamId);

      res.status(200).json({
        success: true,
        message: secretExisted 
          ? `Secret reset successfully for team ${teamId}` 
          : `No secret found for team ${teamId}, nothing to reset`,
        data: {
          teamId,
          secretExisted
        }
      });

    } catch (err) {
      console.error('Unexpected error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    }
  }
}

module.exports = new TotpController();