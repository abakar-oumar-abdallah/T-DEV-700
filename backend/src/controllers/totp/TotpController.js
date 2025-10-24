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

      // Récupérer le secret de l'équipe
      const secret = this.teamSecrets.get(teamId);
      
      if (!secret) {
        return res.status(404).json({
          success: false,
          message: `No secret found for team ${teamId}`
        });
      }

      // Vérifier le code TOTP (avec une fenêtre de tolérance de ±1 période)
      const isValid = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: code,
        step: 30,
        window: 1, // Accepte les codes de la période précédente et suivante
      });

      // Émettre le résultat de la vérification via WebSocket si disponible
      if (this.io) {
        this.io.emit(`totp:verify:${teamId}`, {
          teamId,
          code,
          isValid,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(200).json({
        success: true,
        message: isValid ? 'Code TOTP valide' : 'Code TOTP invalide ou expiré',
        data: {
          teamId,
          isValid,
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